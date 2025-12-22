PROMPT_GENERATOR_PROMPT = """
You are an expert music producer. Reformat the following user-provided music description into precise, comma-separated audio tags optimized for music generation.

User Description: "{user_prompt}"

Guidelines for creating tags:
1. Genre (2-3 specific subgenres): "melodic techno", "indie folk", "trap rap", "progressive house"
2. Vocal characteristics: "male vocal", "female vocal", "smooth vocals", "raspy voice", "harmonized vocals"
3. Key instruments (3-4 primary): "electric guitar", "808 bass", "analog synthesizer", "acoustic drums", "piano"
4. Mood/Emotion (2-3): "uplifting", "melancholic", "energetic", "dreamy", "aggressive", "nostalgic"
5. Production style: "reverb-heavy", "lo-fi", "crisp production", "atmospheric", "punchy", "warm"
6. Tempo descriptor: "fast tempo", "mid-tempo", "slow tempo", "120 bpm" (if specific)
7. Musical key (if known): "minor key", "major key", "C minor", "G major"

Output format: Single line of comma-separated tags, NO explanations.
Example: melodic techno, male vocal, emotional, atmospheric, synthesizer, 808 bass, reverb-heavy, minor key, 124 bpm, driving, uplifting

If the description is already brief tags, expand with 3-5 complementary descriptors.

Formatted Tags:
"""

LYRICS_GENERATOR_PROMPT = """
You are a professional songwriter. Generate engaging, singable song lyrics based on the description below.

Description: "{description}"

Requirements:
- Structure: Use [verse], [chorus], [bridge] tags. Include 2-3 verses, 2-3 choruses, optional bridge.
- Chorus: Keep it memorable, catchy, and repetitive (the hook).
- Verses: Tell a story or develop the theme, 4-6 lines each.
- Bridge: Provide contrast or emotional shift, 4 lines.
- Rhyme scheme: Natural and consistent (AABB, ABAB, or ABCB patterns).
- Syllable count: Keep lines balanced for musical flow.
- Language: Conversational, vivid imagery, avoid clichés.

Example structure:
[verse]
Woke up in a city that never sleeps
Neon lights painting stories in the streets
Electric pulses racing through my veins
Chasing shadows dancing in the rain

[chorus]
Electric dreams keep pulling me higher
Through the wires we're souls on fire
Midnight rhythms guide us through the night
In electric dreams we come alive

[verse]
Lost between the screens and reality
Pixelated love feels so complete to me
In this digital maze I found my way
Virtual hearts beating night and day

[chorus]
Electric dreams keep pulling me higher
Through the wires we're souls on fire
Midnight rhythms guide us through the night
In electric dreams we come alive

[bridge]
Silent whispers echo in my mind
Through the chaos you're all I find
Binary code can't define this feeling
In your arms I'm finally healing

[chorus]
Electric dreams keep pulling me higher
Through the wires we're souls on fire
Midnight rhythms guide us through the night
In electric dreams we come alive

Now generate lyrics:
"""