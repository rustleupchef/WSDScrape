# About
This is a collection of a bunch of debate motion analysis and world-schools rounds for giving LLMs context of generating path to ballots, debate cases, and motion analysis.

# Usage

Simply run
```bash
node script.js
```
and the code will generate all the markdown files into the output/ directory.

To generate the INSTRUCTIONS.md file

 - Enter all the files seen in the output folder into the a new projects folder
 - Enter the prompt below the list into claude
 - Copy the output of the data into the project instructions set.

```Based of all the debate rounds and motion analysis given, generate a instruction set for a claude project that takes all of it into account, so that the project is good at generating debate cases, topic analysis, and path to ballots.```

# Files

output/
 - WOWI motion analysis
 - Videos of debate motions

INSTRUCTIONS.md
 - This file contains all of the instructions to ensure that Claude or any other LLM will be able to correctly perform debate related activities