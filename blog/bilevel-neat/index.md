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
    <p class="blog-deck">Most neural networks are born fully formed. What if useful computational structure must instead emerge through stepping stones that no designer could specify in advance?</p>
    <p class="blog-meta">Ruijia Zhang · 2026</p>
  </header>

Most neural networks are born fully formed. Before training begins, we decide how many layers they contain, how units are connected, and which nonlinearities they use. Optimization then searches for good weights inside that predefined computational structure.

This separation has been extraordinarily productive, but it is still a modeling choice. The architecture determines which computations are available to learning; the optimizer can tune those computations, but it cannot usually invent new ones. That suggests a different question: **what if learning could shape not only the weights of a neural network, but the network itself?**

The deeper motivation comes from a deceptively simple idea: **greatness cannot always be planned**. Stanley and Lehman use this phrase to describe search problems in which the stepping stones toward an ambitious outcome do not resemble the outcome itself and may not appear valuable when judged too early ([Stanley & Lehman, 2015](https://link.springer.com/book/10.1007/978-3-319-15524-1)). A final neural architecture may have the same character. Its useful intermediate structures need not be the structures a designer would have chosen by working backward from the finished network.

The experiment described here explores that possibility through a developmental learning regime. Neural structure can change as candidate networks acquire nodes, connections, and activation functions. Parameter optimization then tests what each structure can do when its weights have had time to adapt. These processes do not occur as a single irreversible sequence. They interact repeatedly, with the balance gradually shifting from structural exploration toward more intensive parameter refinement.

## Why greatness cannot be planned

Learning parameters and learning structure solve different problems. Weight optimization asks how strongly existing units should influence one another. Structural learning asks which units and pathways should exist at all. Fixing an architecture in advance removes the second degree of freedom and places the full burden of adaptation on the first.

Trainable architectures, neural architecture search, and neuroevolution already study this broader problem. This project examines one regime in which structural variation and weight optimization operate on different time scales.

That coordination matters because a structural mutation rarely arrives with mature parameters. If selection judges it immediately, the search may eliminate a promising pathway before learning makes it functional. Yet optimizing every candidate deeply would make structural exploration prohibitively expensive.

This experiment still uses an explicit task objective; it is not an implementation of non-objective or novelty search. The connection to “greatness cannot be planned” is narrower and more concrete: the final topology is not specified in advance, and the value of a structural stepping stone can become visible only after its parameters adapt. Developmental learning therefore involves an allocation problem: when should the system explore new computational structure, and when should it refine what it already has?

## Inspiration from brain development

Biological neural systems motivate this perspective without supplying a literal algorithm. Neural structure, connectivity, and synaptic efficacy all change during development, on different time scales.

The computational analogy reduces that complexity to two mechanisms. **Structural growth** changes the graph through which information flows. **Synaptic refinement** optimizes parameters within a candidate graph. An evolved node is not a biological neuron, a mutation is not neurogenesis, and these experiments do not model human brain development. Biology instead motivates a design question: can structure and parameters develop together?

<figure class="blog-figure blog-hero-animation">
  <img src="{{ '/assets/img/blog/bilevel-neat/neurodevelopment.svg' | relative_url }}?v=20261009-7" alt="Animated illustration of structural growth, pruning, and later weight refinement">
  <figcaption>A visual analogy for developmental learning. Early training places more emphasis on adding and pruning structure; later training devotes more computation to refining connection weights. The implementation continues to alternate topology changes and weight optimization rather than freezing the graph after a single growth stage.</figcaption>
</figure>

## A developmental learning regime

The learning cycle begins with a population of neural graphs. Within each generation, every graph receives its own parameter-optimization run. The resulting network is evaluated, structurally similar candidates are grouped into species, and selection determines which graphs produce the next generation. Crossover and structural mutations then create new candidates, and weight optimization begins again.

Let <i>𝒯</i> denote a network topology, <i>w</i> its weights and biases, <i>f</i> the objective used to optimize parameters, and <i>F</i> the fitness used to compare topologies. The idealized bilevel problem is:

<div class="math-block" role="math" aria-label="Bilevel optimization formulation">
  <div><span class="math-label">Inner level</span> <i>w</i><sup>∗</sup>(𝒯) ∈ arg max<sub><i>w</i></sub> <i>f</i>(𝒯, <i>w</i>)</div>
  <div><span class="math-label">Upper level</span> 𝒯<sup>∗</sup> ∈ arg max<sub>𝒯</sub> <i>F</i>(𝒯, <i>w</i><sup>∗</sup>(𝒯))</div>
</div>

The inner problem asks what a fixed structure can do after its parameters adapt. The upper problem compares structures using that adapted performance. The implementation cannot solve the inner problem exactly. With a finite optimization budget <i>B</i><sub><i>g</i></sub> in generation <i>g</i>, it computes an approximation:

<div class="math-block compact" role="math" aria-label="Finite per-generation approximation">
  <div>ŵ<sub><i>i</i></sub><sup>(<i>g</i>)</sup> = 𝒜<sub><i>B</i><sub><i>g</i></sub></sub>(𝒯<sub><i>i</i></sub><sup>(<i>g</i>)</sup>, ŵ<sub><i>i</i></sub><sup>(<i>g</i>−1)</sup>)</div>
  <div><i>s</i><sub><i>i</i></sub><sup>(<i>g</i>)</sup> = <i>F</i>(𝒯<sub><i>i</i></sub><sup>(<i>g</i>)</sup>, ŵ<sub><i>i</i></sub><sup>(<i>g</i>)</sup>)</div>
  <div>𝒫<sup>(<i>g</i>+1)</sup> = 𝓜<sub><i>g</i></sub>(𝓢<sub><i>g</i></sub>(𝒫<sup>(<i>g</i>)</sup>, <i>s</i><sup>(<i>g</i>)</sup>))</div>
</div>

Here 𝒜 is CMA-ES or Adam, warm-started when parameters can be inherited; 𝓢 denotes speciation and selection; and 𝓜 denotes crossover and structural mutation. In plain language, one generation is:

<div class="process-line" aria-label="One generation of developmental learning">
  <span>adapt parameters</span><b>→</b><span>evaluate structures</span><b>→</b><span>speciate and select</span><b>→</b><span>vary topology</span><b>↺</b>
</div>

The two processes make complementary contributions. Structural mutations open new computational routes, while the inner optimizer determines whether those routes can be used. Evaluation then feeds the result back to structural evolution. Over many generations, topology affects which parameter solutions are reachable, and parameter learning affects which topologies survive.

The SlimeVolley experiment also changes this balance over time. Its first phase explores many graphs with relatively shallow weight searches. Its second phase narrows the population and gives survivors much deeper weight optimization. Structural mutations become less frequent and crossover stops, but topology is not completely fixed: low-probability node, connection, and activation mutations remain. “Growth” and “refinement” are therefore emphases within an alternating process, not two isolated blocks.

## Bringing the idea to life

NEAT, or NeuroEvolution of Augmenting Topologies, supplies the structural machinery ([Stanley & Miikkulainen, 2002](https://direct.mit.edu/evco/article/10/2/99/1123/Evolving-Neural-Networks-through-Augmenting)). Standard NEAT represents nodes and connections as genes, aligns graphs through innovation numbers during crossover, and uses speciation to protect structural novelty. It typically begins with minimal networks and incrementally augments them.

This implementation retains those ideas but gives each fixed graph a dedicated parameter optimizer. For SlimeVolley, CMA-ES optimizes a deterministic vector of weights and biases, warm-starting surviving candidates. Its shaped objective includes reward and rally duration; topology selection primarily uses win rate.

Two structural operators are initialized to preserve the network’s current behavior. Adding a node splits an existing connection and inserts an identity unit with compensating weights. Adding a connection gives the new edge weight zero. Both operations increase capacity without immediately erasing a working policy. Changing a hidden unit’s activation is not behavior-preserving, so the next inner optimization must absorb the disruption.

<figure class="blog-figure">
  <img src="{{ '/assets/img/blog/bilevel-neat/mutations.png' | relative_url }}" alt="Add-node, add-connection, and change-activation operators">
  <figcaption>Structural variation can expose new degrees of freedom without forcing an immediate behavioral jump. Add-node and add-connection preserve the current function at initialization; activation changes do not.</figcaption>
</figure>

The finite schedule makes the computational tradeoff concrete. The exploratory phase runs 25 NEAT generations with 15 candidates and 150 CMA-ES generations per topology. The refinement phase runs 10 NEAT generations with 5 candidates and 1,500 CMA-ES generations per topology. This is not a general prescription. It is one way to spend limited computation on breadth first and depth later.

## Watching networks develop

### Structural development in SlimeVolley

SlimeVolley provides a sparse, non-differentiable control problem. Each agent maps a 12-dimensional observation to three binary actions: forward, jump, and backward. Because this implementation cannot differentiate through the game reward, CMA-ES searches the parameters of each candidate controller.

Starting from a minimal graph, the final champion grew to **8 hidden nodes, 48 enabled connections, and 59 parameters**, with ReLU, identity, sigmoid, and leaky-ReLU hidden units. Without controlled ablations or repeated seeds, this single solution cannot establish that activation diversity or any one operator caused its behavior.

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

That shift makes several questions visible. How can a system protect structures whose usefulness has not matured? When should it preserve prior behavior or tolerate disruption? How should complexity respond to the tasks a system encounters? What feedback allows structural adaptation and parameter learning to cooperate?

A fixed network learns within a space chosen by its designer. A developmental network also changes the space in which its future learning will occur. Its eventual structure may depend on stepping stones whose value could not have been read from the final objective alone. Understanding that interaction may be one route toward a broader science of how useful computational organization arises—not a complete account of intelligence, but a tractable place to study how structure and learning co-develop.

## References

<ol class="reference-list">
  <li>Stanley, K. O., & Lehman, J. (2015). <a href="https://link.springer.com/book/10.1007/978-3-319-15524-1"><em>Why Greatness Cannot Be Planned: The Myth of the Objective</em></a>. Springer.</li>
  <li>Stanley, K. O., & Miikkulainen, R. (2002). <a href="https://direct.mit.edu/evco/article/10/2/99/1123/Evolving-Neural-Networks-through-Augmenting">Evolving neural networks through augmenting topologies</a>. <em>Evolutionary Computation</em>, 10(2), 99–127.</li>
</ol>
</article>
