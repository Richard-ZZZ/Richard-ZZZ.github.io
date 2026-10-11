---
layout: default
title: "Learning to Grow — Ruijia Zhang"
permalink: /blog/bilevel-neat/
---

<article class="blog-article" markdown="1">
  <a class="blog-back" href="{{ '/' | relative_url }}">← back to home</a>

  <header class="blog-header">
    <p class="blog-kicker">Science of AI · Developmental Learning</p>
    <h1>Learning to Grow: A Developmental Paradigm for Neural Networks</h1>
    <p class="blog-deck">Most neural networks are born fully formed. This experiment asks what changes when learning can shape both a network’s connections and the parameters carried by those connections.</p>
    <p class="blog-meta">Ruijia Zhang · 2026 · Based on an experimental report</p>
  </header>

Most neural networks are born fully formed. Before training begins, we decide how many layers they contain, how units are connected, and which nonlinearities they use. Optimization then searches for good weights inside that predefined computational structure.

This separation has been extraordinarily productive, but it is still a modeling choice. The architecture determines which computations are available to learning; the optimizer can tune those computations, but it cannot usually invent new ones. That suggests a different question: **what if learning could shape not only the weights of a neural network, but the network itself?**

The experiment described here explores that question through a developmental learning regime. Neural structure can change as candidate networks acquire nodes, connections, and activation functions. Parameter optimization then tests what each structure can do when its weights have had time to adapt. These processes do not occur as a single irreversible sequence. They interact repeatedly, with the balance gradually shifting from structural exploration toward more intensive parameter refinement.

## Learning beyond fixed architectures

Learning parameters and learning structure solve different problems. Weight optimization asks how strongly existing units should influence one another. Structural learning asks which units and pathways should exist at all. Fixing an architecture in advance removes the second degree of freedom and places the full burden of adaptation on the first.

Trainable architectures, neural architecture search, and neuroevolution already study versions of this broader problem. The purpose of this project is not to claim that evolving neural structure is new. It is to examine a particular regime in which structural variation and weight optimization are coordinated on different time scales.

That coordination matters because a structural mutation rarely arrives with parameters that reveal its eventual value. A useful new pathway can initially look ineffective simply because its weights are immature. If selection judges it immediately, the search may eliminate a promising structure before parameter learning has made it functional. Conversely, spending too much computation optimizing every candidate can make structural exploration prohibitively expensive. Developmental learning therefore involves an allocation problem: when should the system explore new computational structure, and when should it refine what it already has?

## Inspiration from brain development

Biological neural systems motivate this perspective without supplying a literal algorithm. During development, neural structure, connectivity, and synaptic efficacy all change. Structural plasticity and synaptic plasticity are distinct processes, and their relative importance varies over time.

The computational analogy here reduces that complexity to two mechanisms. **Structural growth** changes the graph through which information can flow. **Synaptic refinement** optimizes weights and biases within a candidate graph. The analogy is deliberately limited: an evolved node is not a biological neuron, a mutation operator is not neurogenesis, and these experiments do not model human brain development. Biology instead provides a useful design question: can a learning system benefit when its computational structure and its parameters develop together?

<figure class="blog-figure blog-hero-animation">
  <img src="{{ '/assets/img/blog/bilevel-neat/neurodevelopment.svg' | relative_url }}?v=20261009-7" alt="Animated illustration of structural growth, pruning, and later weight refinement">
  <figcaption>A visual analogy for developmental learning. Early training places more emphasis on adding and pruning structure; later training devotes more computation to refining connection weights. The implementation continues to alternate topology changes and weight optimization rather than freezing the graph after a single growth stage.</figcaption>
</figure>

## A developmental learning regime

The learning cycle begins with a population of neural graphs. Within each generation, every graph receives its own parameter-optimization run. The resulting network is evaluated, structurally similar candidates are grouped into species, and selection determines which graphs produce the next generation. Crossover and structural mutations then create new candidates, and weight optimization begins again.

This gives the process two coupled search variables: a topology (T) and its parameters (w). Conceptually, the topology search prefers structures according to the performance reached after optimizing their parameters. In practice, the inner optimization is finite, so the method only approximates the idealized bilevel objective; it does not guarantee an optimal weight vector for every graph.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/pipeline.png' | relative_url }}" alt="Six-step developmental learning pipeline for one generation">
  <figcaption>One generation of the implemented cycle: optimize the parameters of each graph, evaluate behavior, preserve structural diversity through speciation, select parents, and produce structural variants for the next round.</figcaption>
</figure>

The two processes make complementary contributions. Structural mutations open new computational routes, while the inner optimizer determines whether those routes can be used. Evaluation then feeds the result back to structural evolution. Over many generations, topology affects which parameter solutions are reachable, and parameter learning affects which topologies survive.

The SlimeVolley experiment also changes this balance over time. Its first phase explores many graphs with relatively shallow weight searches. Its second phase narrows the population and gives survivors much deeper weight optimization. Structural mutations become less frequent and crossover stops, but topology is not completely fixed: low-probability node, connection, and activation mutations remain. “Growth” and “refinement” are therefore emphases within an alternating process, not two isolated blocks.

## Bringing the idea to life

NEAT, or NeuroEvolution of Augmenting Topologies, supplies the structural machinery. Standard NEAT represents nodes and connections as genes, aligns graphs through innovation numbers during crossover, and uses speciation to protect structural novelty. It typically begins with minimal networks and incrementally augments them.

This implementation retains those ideas but separates topology selection from a dedicated parameter optimizer. For the non-differentiable SlimeVolley reward, each fixed graph is optimized with CMA-ES. A deterministic parameter vector contains enabled connection weights followed by hidden- and output-node biases, which lets surviving candidates warm-start from their previous values. Weight optimization uses a shaped objective that includes episode reward and rally duration; topology selection primarily uses win rate, with score only as a tiebreaker.

Two structural operators are initialized to preserve the network’s current behavior. Adding a node splits an existing connection and inserts an identity unit with compensating weights. Adding a connection gives the new edge weight zero. Both operations increase capacity without immediately erasing a working policy. Changing a hidden unit’s activation is not behavior-preserving, so the next inner optimization must absorb the disruption.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/mutations.png' | relative_url }}" alt="Add-node, add-connection, and change-activation operators">
  <figcaption>Structural variation can expose new degrees of freedom without forcing an immediate behavioral jump. Add-node and add-connection preserve the current function at initialization; activation changes do not.</figcaption>
</figure>

The finite schedule makes the computational tradeoff concrete. The exploratory phase runs 25 NEAT generations with 15 candidates and 150 CMA-ES generations per topology. The refinement phase runs 10 NEAT generations with 5 candidates and 1,500 CMA-ES generations per topology. This is not a general prescription. It is one way to spend limited computation on breadth first and depth later.

## Watching networks develop

### Structural development in SlimeVolley

SlimeVolley provides a sparse, non-differentiable control problem. Each agent maps a 12-dimensional observation to three binary actions: forward, jump, and backward. Because this implementation cannot differentiate through the game reward, CMA-ES searches the parameters of each candidate controller.

Starting from a minimal graph, the final champion grew to **8 hidden nodes, 48 enabled connections, and 59 parameters**. Its hidden units included ReLU, identity, sigmoid, and leaky-ReLU activations. The result is a sparse, heterogeneous controller rather than a hand-specified multilayer network. These observations describe one evolved solution; without controlled ablations or repeated seeds, they do not establish that activation diversity or any single operator caused its behavior.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/slimevolley.gif' | relative_url }}" alt="Evolved agent playing SlimeVolley against the built-in baseline">
  <figcaption>The evolved controller (yellow) plays the built-in baseline (blue). Its behavior reflects repeated alternation between structural variation and CMA-ES weight optimization.</figcaption>
</figure>

### Replacing evolutionary weight search with gradients

The same organizational idea can use a different inner optimizer when the objective is differentiable. For Circle, XOR, Moons, and Spiral classification, each sparse graph is compiled into a JAX computation and trained with Adam for 200–300 epochs. The topology search still adds nodes and connections, changes activations, and occasionally toggles edges. A complexity term favors smaller graphs:

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

The Spiral task reveals a limitation of incremental growth. Beginning from a minimal graph with a complexity penalty left the search at **64.4% accuracy** and no hidden nodes. New capacity carried an immediate cost, while its benefit appeared only after several structural and parametric changes. Selection therefore favored the simpler linear classifier.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/spiral-failure.png' | relative_url }}" alt="Spiral classification failure from a minimal graph with no hidden nodes">
  <figcaption>A growth barrier: the minimal initialization and complexity-penalized objective favor a linear graph before added capacity can become useful.</figcaption>
</figure>

The successful run began instead with 15–20 hidden nodes and used a lower complexity penalty. It reached **95.0% accuracy** with 18 hidden nodes and 72 connections.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/spiral-success.png' | relative_url }}" alt="Successful Spiral classifier with a nonlinear decision boundary and evolved graph">
  <figcaption>With more initial capacity and a weaker size penalty, parameter learning can use nonlinear structure immediately while evolution reorganizes the graph.</figcaption>
</figure>

Because both the initialization and penalty changed, this contrast is not a controlled ablation of either choice. It nevertheless exposes an important tension: a preference for compact models can prevent a developmental search from crossing intermediate states whose value appears only later.

## Toward self-organizing intelligence

These experiments do not show that developmental learning is universally better than training a fixed architecture. They compare neither methods under a common compute budget nor outcomes across multiple random seeds. They also do not reproduce biological development. What they provide is a concrete setting in which computational structure becomes part of learning rather than a decision made entirely beforehand.

That shift makes several scientific questions visible. How can a system protect structures whose usefulness has not yet matured? When should it preserve prior behavior, and when should it tolerate disruption? How should computational complexity respond to the tasks a system encounters? And what forms of feedback allow structural adaptation and parameter learning to help rather than obstruct one another?

A fixed network learns within a space chosen by its designer. A developmental network also changes the space in which its future learning will occur. Understanding that interaction may be one route toward a broader science of how useful computational organization arises—not a complete account of intelligence, but a tractable place to study how structure and learning co-develop.

<p class="blog-meta">The complete experimental write-up, including implementation details and references, is available in the <a href="https://docs.google.com/document/d/1uOiV9imCH_XiujNTpg9TIZdmpMVNW90Y/edit#heading=h.6hf80bjj0en">original report</a>.</p>
</article>
