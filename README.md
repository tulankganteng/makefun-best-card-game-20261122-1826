# Ember Court — a duel of cards

[![make.fun bounty](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/tulankganteng/makefun-best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/tulankganteng/makefun-best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

A complete original card duel for the
[make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).
You sit at the Ember Court across from the Cinder Duchess: 30 life each,
a 30-card deck drawn from the four houses — Ember, Tide, Thorn and Gale —
and a mana crystal more every turn, up to 10. Play creatures onto your
side of the table, swing them at her creatures or straight at her, and
answer her spells with your own. First flame to 0 life loses the Court.

## How it plays

- **Click** a card in your hand to play it (if you can afford the mana).
  Spells that need a target — Spark Burst — ask you to click an enemy
  creature or the Duchess herself. **Keys 1–7** play hand cards the same way.
- **Click** one of your ready creatures (green outline), then an enemy
  creature or the Duchess, to attack. Creatures cannot attack the turn
  they are played, and a creature that attacks takes the damage back.
- **Space / Enter** — end your turn. **Esc** — cancel a selection.
  **R** — start a new duel.
- Draw from an empty deck and fatigue bites: 1 damage, then 2, then 3…
  so a stalled duel still ends.
- The Duchess plays by the same rules you do: she spends her mana on the
  best creature she can afford, mends when she is hurt, clears a wide
  board with Cinder Rain, and swings for lethal the moment she sees it.

## The deck

16 original cards, 30 in the deck: 12 creatures (three per house) and 4
spells. Ember hits hard and dies fast; Tide is patient and hard to
remove; Thorn outlasts you; Gale strikes first. Spark Burst deals 3 to
any target, Mend restores 5 life, Whispered Map draws 2, Cinder Rain
deals 2 to all enemy creatures.

## Run it

```sh
node serve.ts
# open http://localhost:8080/ in a desktop browser
```

No build step, no network requests, no libraries — plain static files
under `game/`, all sound synthesized with WebAudio.

## Shots

`shots.json` lists the four deterministic frames under `screenshots/`:
the title screen, a mid-duel table (both hands, both boards, life and
mana totals in one frame), the victory screen and the defeat screen.
Each is a real render of the game's own code via `?shot=<name>&seed=1`.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).
