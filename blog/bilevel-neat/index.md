---
layout: default
title: "Bi-Level Neuroevolution — Ruijia Zhang"
permalink: /blog/bilevel-neat/
---

<article class="blog-article" markdown="1">
  <a class="blog-back" href="{{ '/' | relative_url }}">← back to home</a>

  <header class="blog-header">
    <p class="blog-kicker">Technical blog · Neuroevolution</p>
    <h1>Bi-Level Neuroevolution: Separating Topology Search from Weight Optimization</h1>
    <p class="blog-deck">What changes when an evolutionary algorithm is allowed to judge a network architecture only after its weights have had time to mature?</p>
    <p class="blog-meta">Ruijia Zhang · 2026 · Based on an experimental report</p>
  </header>

## The problem with evolving everything at once

NEAT—NeuroEvolution of Augmenting Topologies—evolves both the structure and the parameters of a neural network. It starts from a minimal graph and gradually adds nodes and connections, using innovation numbers to align genes during crossover and speciation to protect structural novelty.

That coupling is elegant, but it creates a practical problem. A newly mutated topology usually arrives with immature weights. If selection evaluates it immediately, a promising architecture can disappear before its parameters have adapted enough to reveal its potential. Structural search and parameter search are operating on different time scales, yet standard NEAT asks them to compete on the same clock.

The central idea of this project is to make those two levels explicit:

- **Upper level:** search over topology—nodes, connections, and activation functions.
- **Lower level:** optimize the weights and biases for each fixed topology.

Only after the lower-level optimizer has improved a candidate's parameters do we compare its structure with the rest of the population.

<div class="blog-callout">
  <p><strong>The guiding principle:</strong> do not reject a topology because its weights have not yet learned how to use it.</p>
</div>

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/pipeline.png' | relative_url }}" alt="Six-step Bi-Level NEAT generation pipeline">
  <figcaption>One generation of Bi-Level NEAT: optimize each genome's weights, evaluate it, preserve structural diversity through speciation, then select, cross over, and mutate.</figcaption>
</figure>

## Part I: gradient-free control in SlimeVolley

The first test is SlimeVolley, a competitive control environment with sparse, non-differentiable rewards. Each agent observes a 12-dimensional state—positions and velocities for itself, the ball, and its opponent—and produces three binary actions: move forward, jump, and move backward.

Because the reward cannot be differentiated through the game, the lower level uses **CMA-ES**. For every candidate topology, CMA-ES optimizes a deterministic vector containing enabled connection weights, hidden-node biases, and output biases. Surviving topologies warm-start from their previous parameters instead of beginning from scratch.

### Behavior-preserving structural mutations

Two mutations are designed not to change the network's output at the moment they are introduced:

- **Add node:** split a connection with an identity node, using weights that reproduce the original computation.
- **Add connection:** initialize the new edge at weight zero.

This matters because structural exploration should not automatically destroy a competent policy. CMA-ES can then decide whether the new degrees of freedom are useful.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/mutations.png' | relative_url }}" alt="Behavior-preserving add-node and add-connection mutations and a change-activation mutation">
  <figcaption>Add-node and add-connection mutations preserve behavior at initialization; changing an activation does not and therefore requires re-optimization.</figcaption>
</figure>

### Explore topology, then refine weights

Training follows a two-phase schedule inspired by development and pruning:

1. **Topology exploration.** Aggressive structural mutations, crossover, and shallow CMA-ES runs produce a diverse collection of architectures.
2. **Weight refinement.** Structural change slows down while the strongest topologies receive much deeper CMA-ES optimization.

The final SlimeVolley champion was trained on a single 32-CPU node. It grew from a minimal controller to a sparse network with **8 hidden nodes, 48 enabled connections, and 59 parameters**. Its hidden units used a heterogeneous mix of ReLU, identity, sigmoid, and leaky-ReLU activations rather than a single hand-chosen nonlinearity.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/slimevolley.gif' | relative_url }}" alt="Bi-Level NEAT agent playing SlimeVolley against the built-in baseline">
  <figcaption>The evolved agent (yellow) plays against the built-in baseline (blue).</figcaption>
</figure>

## Part II: replacing CMA-ES with backpropagation

The same bi-level structure also works when the lower-level objective is differentiable. For Circle, XOR, Moons, and Spiral classification tasks, I replaced CMA-ES with Adam and implemented each evolved topology as a JAX-compatible computation graph.

The topology level still adds nodes, connections, and activation changes. The weight level now uses exact gradients through arbitrary sparse graphs. A complexity penalty encourages compact solutions:

`fitness = accuracy − λ × (hidden nodes + 0.1 × connections)`

<div class="blog-table-wrap">
<table>
  <thead>
    <tr><th>Task</th><th>Accuracy</th><th>Hidden nodes</th><th>Connections</th></tr>
  </thead>
  <tbody>
    <tr><td>Circle</td><td>99.4%</td><td>3</td><td>11</td></tr>
    <tr><td>XOR</td><td>93.2%</td><td>3</td><td>12</td></tr>
    <tr><td>Moons</td><td>90.0%</td><td>3</td><td>12</td></tr>
    <tr><td>Spiral</td><td>95.0%</td><td>18</td><td>72</td></tr>
  </tbody>
</table>
</div>

Backpropagation made weight fitting dramatically faster, but the Spiral task exposed an important failure mode.

## A growth barrier created by complexity regularization

Starting Spiral from a minimal network failed. The complexity penalty discouraged new nodes before those nodes could improve the decision boundary, leaving the search stuck at **64.4% accuracy** with no hidden units. The architecture needed additional capacity, but every intermediate step toward that capacity looked worse under the penalized objective.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/spiral-failure.png' | relative_url }}" alt="Spiral classification failure from a minimal network with no hidden nodes">
  <figcaption>Minimal initialization plus a complexity penalty creates a growth barrier: the search remains a linear classifier.</figcaption>
</figure>

The successful strategy reversed the direction of search: initialize with 15–20 hidden nodes, lower the penalty, and let selection prune or reorganize excess capacity. This reached **95.0% accuracy** with an 18-hidden-node network using a mixture of ReLU, leaky-ReLU, and tanh units.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/spiral-success.png' | relative_url }}" alt="Successful Spiral classifier with a nonlinear decision boundary and evolved network">
  <figcaption>With sufficient initial capacity, backpropagation can exploit the graph immediately and evolution can refine the topology.</figcaption>
</figure>

## What I learned

Three lessons carried across both halves of the project.

1. **Topology and weights deserve separate optimization budgets.** Structural novelty should be evaluated after its parameters have adapted—not at birth.
2. **Behavior-preserving mutations make structural exploration safer.** They let evolution add capacity without immediately erasing a useful policy.
3. **Parsimony can block the path to useful complexity.** For hard tasks, growing from the smallest possible model may be worse than beginning over-parameterized and pruning.

The broader point is not that CMA-ES always beats backpropagation, or vice versa. The right lower-level optimizer depends on the learning signal: gradients are extraordinarily efficient when they exist, while gradient-free search remains valuable for interactive environments and discontinuous objectives. The bi-level view gives both optimizers the same conceptual role and lets topology search operate on a fairer comparison between architectures.

<p class="blog-meta">The complete experimental write-up, including implementation details and references, is available in the <a href="https://docs.google.com/document/d/1uOiV9imCH_XiujNTpg9TIZdmpMVNW90Y/edit#heading=h.6hf80bjj0en">original report</a>.</p>
</article>
