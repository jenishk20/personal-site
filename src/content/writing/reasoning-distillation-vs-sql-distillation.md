---
title: Distilling reasoning beat distilling SQL by 5.2 points
description: On BIRD, training a 7B on a 480B teacher's chain-of-thought generalized to unseen databases in a way that training on the teacher's final SQL did not.
date: 2026-08-10
tag: post-training
draft: true
---

<!--
  DRAFT — assembled from the numbers in your profile README so the structure and
  the tables are in place. Every figure below is yours and already public, but the
  prose is a skeleton: rewrite it in your own voice, then delete this comment and
  set `draft: false` in the frontmatter to publish.

  Gaps worth filling before you ship it:
   - what the CoT traces actually looked like, and how you filtered them
   - why you think reasoning transfers and SQL doesn't (the mechanism)
   - the Best-of-N ablation in more detail
   - what failed that isn't in the table
-->

The setup: Qwen2.5-Coder-7B, benchmarked on BIRD dev (1,534 questions). Accuracy here
means **result accuracy** — every generated query is executed against the real
database and the result sets are compared. No fuzzy string matching, no exact-match
SQL scoring, because both of those lie in different directions.

## The ladder

| Stage | Accuracy |
|---|---|
| Base Qwen2.5-Coder-7B, no adapter | 27.0% |
| SFT on BIRD train, direct SQL | 46.9% |
| SFT + frontier DPO (1,219 correctness pairs) | 50.3% |
| CoT-SFT, reasoning distilled from Qwen3-Coder-480B | **52.1%** |
| CoT-SFT + Best-of-N (K=8, execution-based self-consistency) | **58.5%** |
| 14B SFT + Best-of-N (K=4) | 59.3% |

## Two things moved the needle

**Distilling the teacher's reasoning rather than its SQL.** Worth +5.2pp over
direct-SQL SFT, and the gain showed up specifically on databases the model hadn't
seen. Training on final queries teaches the shape of an answer; training on the
reasoning appears to teach something closer to the procedure for reaching one.

**Execution-based majority voting at inference.** A further +6.4pp with no
retraining at all. The ablation matters here: selecting the first *executable*
candidate rather than majority-voting recovers only +0.9pp. So the voting is doing
the work, not the extra samples.

## Against frontier models

Same 1,534 questions, all with CoT prompting:

| Model | Params | Accuracy |
|---|---|---|
| GLM 5.2 | 744B | 63.0% |
| DeepSeek V4-Pro | 1.6T | 58.7% |
| **This work, 7B + Best-of-N** | **7B** | **58.5%** |

A 7B ties a 1.6T model at roughly 0.4% of the parameters, and runs locally.

To be clear about what this is not: GLM 5.2 wins outright. This is a
parameter-efficiency result, not a superiority one.

## Artifacts

The model is [qwen2.5-coder-7b-bird-cot](https://huggingface.co/jk200201/qwen2.5-coder-7b-bird-cot),
with a [GGUF build](https://huggingface.co/jk200201/qwen2.5-coder-7b-bird-cot-GGUF)
for local inference. The distilled traces are in
[bird-cot-sft](https://huggingface.co/datasets/jk200201/bird-cot-sft). Code is in
[finetuning-text-to-sql](https://github.com/jenishk20/finetuning-text-to-sql).
