"""Render the original score and opening foley. Run with Python and NumPy."""
from pathlib import Path
import wave
import numpy as np

RATE = 24000
OUT = Path(__file__).resolve().parents[1] / "audio"
rng = np.random.default_rng(72)
# Each tune answers the opening's rising fourth. Numbers are scale degrees in D minor.
# Eight bars per cue. The little rests in each answer leave room for reading.
# name, bpm, beats/bar, lead, bass degrees, four-bar question and four-bar answer
CUES = [
    ("train", 82, 4, "reed", [0,5,3,4,0,2,4,0], [0,3,2,1], [4,3,1,0]),
    ("street", 72, 3, "piano", [0,3,5,4,0,3,4,0], [0,3,4,2], [5,4,1,0]),
    ("entrance", 69, 3, "reed", [2,3,0,4,5,3,4,0], [4,7,6,4], [5,3,1,0]),
    ("gesner", 78, 3, "piano", [0,2,3,4,5,2,4,0], [2,5,4,2], [3,5,1,2]),
    ("fossils", 58, 4, "glass", [0,0,5,3,0,5,4,0], [0,3,2,-1], [0,2,1,0]),
    ("birds", 92, 3, "flute", [2,5,3,4,2,3,4,2], [4,7,8,6], [9,7,5,4]),
    ("office", 75, 4, "piano", [0,5,3,4,2,3,4,0], [2,3,1,0], [4,2,1,0]),
    ("stacks", 59, 3, "reed", [0,0,3,5,0,3,4,0], [-3,0,-1,-3], [0,1,-1,-3]),
    ("bench_keys", 70, 3, "felt", [2,5,3,4,0,3,4,0], [2,4,3,1], [0,3,1,0]),
]
SCALE = [0,2,3,5,7,8,10]

def note(degree, octave, seconds, voice):
    t = np.arange(round(RATE * seconds)) / RATE
    midi = 62 + octave * 12 + SCALE[degree % 7] + 12 * (degree // 7)
    hz = 440 * 2 ** ((midi - 69) / 12)
    phase = 2 * np.pi * hz * t
    if voice in ("reed", "flute", "bow"):
        phase += .0025 * hz * (1 - np.cos(2*np.pi*4.7*t)) * np.minimum(1,t*3)
        amps = {"reed":[1,.25,.28,.05,.07], "flute":[1,.19,.05], "bow":[1,.40,.24,.14,.06]}[voice]
        tone = sum(a*np.sin((i+1)*phase) for i,a in enumerate(amps))
        env = (1-np.exp(-t/.095)) * (.83+.17*np.cos(3*t))
    else:
        modes = [1,2.71,5.12] if voice == "glass" else [1,2.002,3.008,4.019]
        tone = sum(.48**i * np.sin(phase*m) * np.exp(-t*(1.7+i*1.5))
                   for i,m in enumerate(modes))
        env = 1-np.exp(-t/(.009 if voice=="felt" else .003))
    return tone*env*np.minimum(1,(seconds-t)/.12)

def place(track, at, samples, gain):
    # Wrap releases and room reflections into the beginning for a continuous loop.
    idx = (round(at*RATE)+np.arange(len(samples))) % len(track)
    track[idx] += gain*samples

def write(name, data, rms, peak=.83):
    data *= min(rms / np.sqrt(np.mean(data**2)), peak / np.max(np.abs(data)))
    with wave.open(str(OUT / (name+".wav")), "wb") as f:
        f.setparams((1,2,RATE,0,"NONE","not compressed"))
        f.writeframes(np.round(data*32767).astype("<i2").tobytes())

def score(name, bpm, meter, lead, roots, question, answer):
    beat = 60/bpm
    music = np.zeros(round(8*meter*beat*RATE))
    def play(at, degree, octave, beats, instrument, gain):
        place(music, at*beat, note(degree,octave,beats*beat,instrument), gain)
    for bar,(root,top) in enumerate(zip(roots, question+answer)):
        at = bar*meter
        sparse = name in ("stacks","fossils")
        play(at,root,-2,meter*.84,"bow" if sparse else "felt",.32)
        play(at+.05,root+4,-1,meter*.81,"reed",.10)
        if not sparse or bar%2==0:
            play(at+1.02,root+2,-1,1.45,"felt",.24)
        if name=="train":
            for pulse in [1.5,2.5,3.5]:
                play(at+pulse,root+4,-1,.45,"felt",.15)
        if bar in (3,7):
            play(at+.03,top,0,meter-.35,lead,.6)
        else:
            play(at+.08,top,0,1.5 if not sparse else 2.2,lead,.61)
            if not sparse or bar in (1,5):
                play(at+meter-.78,top+(1 if bar%2==0 else -1),0,.72,lead,.40)
        if name=="birds" and bar in (1,4,6):
            play(at+1.45,top+2,0,.32,"flute",.31)
        if bar in (2,6):
            play(at+1.55,root+4,0,.98,"glass" if sparse else "felt",.16)
    dry = music.copy()
    for delay,gain in [(0.041,.12),(.083,.075),(.149,.04)]:
        music += np.roll(dry,round(delay*RATE))*gain
    write(name,music,.14)

for cue in CUES:
    score(*cue)

# A loop of wheel pairs crossing rail joints under a continuous wooden-car rumble.
t = np.arange(RATE*4)/RATE
noise = rng.normal(size=len(t))
rumble = np.convolve(np.pad(noise,(159,0),mode="wrap"),np.ones(160)/160,mode="valid")
rail = .48*rumble+.012*np.sin(2*np.pi*51*t)+.008*np.sin(2*np.pi*78*t)
for beat in range(8):
    for delay,gain in [(0,.40),(.104,.25)]:
        u=np.arange(int(.14*RATE))/RATE
        ring=np.sin(2*np.pi*132*u)+.5*np.sin(2*np.pi*317*u)+.28*rng.normal(size=len(u))
        place(rail,beat*.5+delay,ring*np.exp(-u*51)*np.minimum(1,u*1000),gain)
write("rail_wheels",rail,.115)

t=np.arange(int(.18*RATE))/RATE
hoof=(np.sin(2*np.pi*(285*t+1.8*(1-np.exp(-t*50))))+.58*np.sin(2*np.pi*604*t)+.24*rng.normal(size=len(t)))*np.exp(-t*38)
write("hoof",hoof*np.minimum(1,t*1600),.16)
# Felt hammer and a single high overtone resolve the theme as the facade title appears.
title=np.zeros(int(3.6*RATE))
for at,degree,octave in [(0,0,-1),(.24,3,0),(.82,2,0),(1.48,0,0)]:
    place(title,at,note(degree,octave,2,"piano"),.52)
write("title_phrase",title,.13)
