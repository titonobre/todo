# @titonobre/todo

A CLI for TargetProcess because using TargetProcess on the web is overrated! And slow.

For those moments when you are about to commit a beautiful set of code changes but can't remember the ID of the task
you've been working on.

Just run `todo` on your favorite terminal and boom!

## Getting Started

The most convenient way to use `todo` is to install the package globally.

```sh
npm i -g @titonobre/todo
```

Run the the command `todo`. On the first time you will be prompted for some configuration parameters.

Note that you will need a valid token for TargetProcess. Get one from the
[_Access Tokens_](https://dev.targetprocess.com/docs/authentication#section-personal-access-tokens-set-within-user-interface)
tab on your Profile.

You can run `todo config` at any time to change the configuration.

Run `todo -h` or `todo <command> -h` to the help message for each command.

## Commands

### `todo now`

Show your tasks currently in progress. Use option `-d` to display the task description.

### `todo next`

Show the unassigned tasks on your team in the current iteration. Use option `-d` to display the task description.

### `todo team`

Show all the tasks on your team in the current iteration. Use option `-d` to display the task description.

### `todo config`

Update the configuration file.

## Help and Issues

Contact me on [Slack](https://betfair.slack.com/messages/@U371L3B1P/) or open an issue in
[GitLab](https://gitlab.app.betfair/titonobre/todo/issues).
