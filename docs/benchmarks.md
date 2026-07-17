# Detection Benchmarks

`npm run benchmark:fixtures` is a release gate. It validates labeled safe and vulnerable fixtures,
required and forbidden rule IDs, masked output, and a five-second per-fixture runtime ceiling.

`npm run benchmark:public` scans four public repositories pinned to immutable commits. The scheduled
workflow stores only aggregate file counts, finding counts, rule IDs, and durations. It never stores
finding previews or possible credential values.

The initial public ceilings allow at most a 20 percent increase over the reviewed baseline counts.
Zero-finding repositories must remain at zero.

Update a public benchmark commit only in a reviewed pull request. Rule changes must add positive,
negative, and false-positive fixtures before adjusting a finding-count ceiling.
