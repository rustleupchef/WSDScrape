# About
This is a collection of a bunch of debate motion analysis and world-schools rounds for giving LLMs context of generating path to ballots, debate cases, and motion analysis.

# Usage

Simply run
```bash
# max_videos is technically optional
# including the option will simply limit the number of videos in the output feed
node script.js <MAX_VIDEOS>
```
and the code will generate all the markdown files into the output/ directory.

And, if you want to test that the token count of the files generated isn't far too high then run these commands
```bash
cd overload
# max tokens is technically optional
# including the option will iterate via binary search through video counts till it finds a count of videos that matches your desired amoung of tokens
python3 main.py <MAX_TOKENS>
```
This will return the total token counts of all the files in the output section. If you believe this is too high add a limit to the total videos.
For context, a unpaid claude conversation can handle roughly 200,000 to 500,000 tokens.

To generate the INSTRUCTIONS.md file

 - Enter all the files seen in the output folder into the a new projects folder
 - Enter the prompt below the list into claude
 - Copy the output of the data into the project instructions set or use the provided instruction set.

```
Based of all the debate rounds and motion analysis given, generate a instruction set for a claude project that takes all of it into account, so that the project is good at generating debate cases, topic analysis, and path to ballots.
```

Here are some prompts and tips to start with once you are done setting up:

---

## 🗳️ Path to Ballot

- *"Give me a path to ballot for [Prop/Opp] on the motion: [motion]. The key clashes in the round were [X], [Y], and [Z]."*
- *"I just ran a round on THW restrict free speech to combat right-wing populism and went Prop. We won the democratic backsliding argument but lost on chilling effects. Build me a path to ballot."*
- *"Assume a standard round on THBT affirmative action is counterproductive to equality. Give me the Opp path to ballot assuming Prop ran tokenization and workplace pipelines."*

---

## 📋 Full Case Generation

- *"Generate a full Prop case for [motion], including framing, model, 3 arguments with mechanism and impact, POIs to offer, and a reply speech outline."*
- *"Build me an Opp case for THBT housing is a guaranteed right. Assume Prop will run a positive rights model with government provision."*
- *"Give me both sides' cases for [motion] so I can compare the strongest ground for each."*

---

## 🔍 Topic Analysis

- *"Give me a full topic analysis for [motion], including key definitional battles, the clash landscape, strongest ground for each side, and common pitfalls."*
- *"I have [motion] coming up as an impromptu round. Quick topic analysis — what are the 3 biggest clashes and which side has stronger ground?"*
- *"What are the most likely prop and opp framings for [motion] at a championship-level tournament?"*

---

## 🎯 Bonus: Targeted Coaching Prompts

- *"My Second Prop speech on [motion] kept losing the [X] clash. What's the best mechanization strategy for rebuilding that argument?"*
- *"Write me a reply speech outline for Opp on [motion] assuming we won on [clash] but dropped [argument]."*

---

The most powerful prompts tend to **specify the side, the level of competition, and any clashes or arguments already in play** — the more context you give, the sharper the output.

# Files

output/
 - WOWI motion analysis
 - Videos of debate motions

INSTRUCTIONS.md
 - This file contains all of the instructions to ensure that Claude or any other LLM will be able to correctly perform debate related activities