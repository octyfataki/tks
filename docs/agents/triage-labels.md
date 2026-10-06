# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those
roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the
corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Current consumption

The `triage` skill is **not installed** in this environment, so the
`needs-triage` / `needs-info` / `ready-for-human` / `wontfix` roles are not
exercised today. This file exists because `/to-spec` writes a triage state onto
every spec it publishes, and it uses `ready-for-agent`.

Install the `triage` skill to activate the remaining four roles. The mapping
above is already in place for when that happens.
