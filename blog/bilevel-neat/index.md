---
layout: default
title: "How Intelligence Emerges — Ruijia Zhang"
permalink: /blog/bilevel-neat/
---

<article class="blog-article" markdown="1">
  <a class="blog-back" href="{{ '/' | relative_url }}">← back to home</a>

  <header class="blog-header">
    <p class="blog-kicker">Science of AI · Neurodevelopment</p>
    <h1>How Intelligence Emerges: From Structural Growth to Synaptic Refinement</h1>
    <p class="blog-deck">A neurodevelopment-inspired computational experiment in which networks first grow and prune their structure, then refine the strengths of surviving connections.</p>
    <p class="blog-meta">Ruijia Zhang · 2026 · Based on an experimental report</p>
  </header>

<figure class="blog-figure blog-hero-animation">
  <img src="{{ '/assets/img/blog/bilevel-neat/neurodevelopment.svg' | relative_url }}?v=20261009-2" alt="Animated neurodevelopment analogy showing neurogenesis, synaptogenesis, synaptic pruning, and synaptic plasticity">
  <figcaption>Neurodevelopment analogy from the report: Phase 1 represents neurogenesis, synaptogenesis, and the pruning of weak connections; Phase 2 keeps the structure largely fixed while useful synapses continue to change strength.</figcaption>
</figure>

## The question: how can intelligence emerge?

My broader research question is how intelligence emerges, evolves, and scales. This project turns one part of that question into a computational experiment: can useful behavior emerge when a neural network first develops its structure and only later concentrates on tuning the strengths of the connections that survive?

The motivation comes from a simple observation about neural development. A learning system does not have to treat every aspect of itself as equally plastic at every moment. Structure can grow, connections can be added or removed, and synaptic strengths can be refined on different time scales. Separating those processes may give nascent circuits enough time to reveal what they can become.

This is a **neurodevelopment-inspired analogy**, not a biological model of the brain. Here, topology stands in for circuit structure—neurons, connections, and activation choices—while weights stand in for synaptic strengths. NEAT supplies a computational substrate for structural change; CMA-ES or backpropagation supplies the learning mechanism within a fixed structure.

## A developmental hypothesis in computational form

NEAT—NeuroEvolution of Augmenting Topologies—evolves both the structure and the parameters of a neural network. It starts from a minimal graph and gradually adds nodes and connections, using innovation numbers to align genes during crossover and speciation to protect structural novelty.

That coupling creates a useful test case for the developmental hypothesis. A newly formed topology arrives with immature weights. If selection evaluates it immediately, a promising structure can disappear before its connections have adapted enough to reveal its potential. Structural change and synaptic refinement are operating on different time scales, yet standard NEAT asks them to compete on the same clock.

I therefore make those two time scales explicit:

- **Upper level:** search over topology—nodes, connections, and activation functions.
- **Lower level:** optimize the weights and biases for each fixed topology.

Only after the lower-level optimizer has given a candidate's synaptic strengths time to mature do we compare its structure with the rest of the population. This is less a claim about improving one algorithm than a probe of a broader question: what conditions allow organized behavior to emerge from simultaneous structural and parametric change?

<div class="blog-callout">
  <p><strong>The guiding principle:</strong> do not reject a developing circuit before its synapses have learned how to use its structure.</p>
</div>

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/pipeline.png' | relative_url }}" alt="Six-step Bi-Level NEAT generation pipeline">
  <figcaption>The experimental realization: optimize each network's weights, evaluate its behavior, preserve structural diversity, then select and vary the circuit.</figcaption>
</figure>

## Experiment I: can structure and synaptic strength co-develop in control?

The first test is SlimeVolley, a competitive control environment with sparse, non-differentiable rewards. Each agent observes a 12-dimensional state—positions and velocities for itself, the ball, and its opponent—and produces three binary actions: move forward, jump, and move backward.

Because the reward cannot be differentiated through the game, the lower level uses **CMA-ES**. For every candidate topology, CMA-ES optimizes a deterministic vector containing enabled connection weights, hidden-node biases, and output biases. Surviving topologies warm-start from their previous parameters instead of beginning from scratch.

### Growing without erasing behavior

Two mutations are designed not to change the network's output at the moment they are introduced:

- **Add node:** split a connection with an identity node, using weights that reproduce the original computation.
- **Add connection:** initialize the new edge at weight zero.

This matters because structural exploration should not automatically destroy a competent policy. CMA-ES can then decide whether the new degrees of freedom are useful.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/mutations.png' | relative_url }}" alt="Behavior-preserving add-node and add-connection mutations and a change-activation mutation">
  <figcaption>Add-node and add-connection mutations preserve behavior at initialization; changing an activation does not and therefore requires re-optimization.</figcaption>
</figure>

### From structural exploration to synaptic refinement

Training follows a two-phase schedule inspired by development and pruning:

1. **Topology exploration.** Aggressive structural mutations, crossover, and shallow CMA-ES runs produce a diverse collection of architectures.
2. **Weight refinement.** Structural change slows down while the strongest topologies receive much deeper CMA-ES optimization.

The final SlimeVolley champion was trained on a single 32-CPU node. It grew from a minimal controller to a sparse network with **8 hidden nodes, 48 enabled connections, and 59 parameters**. Its hidden units used a heterogeneous mix of ReLU, identity, sigmoid, and leaky-ReLU activations rather than a single hand-chosen nonlinearity.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/slimevolley.gif' | relative_url }}" alt="Bi-Level NEAT agent playing SlimeVolley against the built-in baseline">
  <figcaption>The evolved agent (yellow) plays against the built-in baseline (blue).</figcaption>
</figure>

## Experiment II: does the developmental split survive with gradients?

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

## Emergence can fail when growth is penalized too early

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

## What this suggests about emergence

Three lessons carried across both experiments.

1. **Emergence depends on time-scale separation.** A new structure should be evaluated after its synaptic strengths have had time to adapt—not at birth.
2. **Structural and synaptic plasticity can complement one another.** Behavior-preserving growth lets a system acquire capacity without immediately erasing what it already knows.
3. **Useful complexity may require protected development.** Penalizing size too early can prevent a circuit from ever crossing the threshold at which richer behavior becomes possible.

The broader point is not that CMA-ES beats backpropagation, nor that this experiment reproduces biological intelligence. The two optimizers simply let us test the same developmental split under different learning signals. What survives both settings is a more general possibility: intelligence may depend not only on what a system learns, but also on **when different parts of the system are allowed to change**.

<p class="blog-meta">The complete experimental write-up, including implementation details and references, is available in the <a href="https://docs.google.com/document/d/1uOiV9imCH_XiujNTpg9TIZdmpMVNW90Y/edit#heading=h.6hf80bjj0en">original report</a>.</p>
</article>
