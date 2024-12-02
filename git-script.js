const { exec } = require('child_process');

const flagConfigMap = {
    '--init': {
        requireArgument: false,
        requirements: {
            arguments: [],
            message: '',
        },
        action() {
            return 'git init';
        },
    },
    '--branch': {
        requireArgument: true,
        requirements: {
            arguments: ['branch name'],
            message: '--branch=<branch name> \n eg. --branch=pws',
        },
        action(value) {
            return `git branch ${value}`;
        },
    },
    '--checkout': {
        requireArgument: true,
        requirements: {
            arguments: ['branch name'],
            message: '--checkout=<branch name> \n eg. --checkout=pws',
        },
        action(value) {
            return `git checkout ${value}`;
        },
    },
    '--add-remote': {
        requireArgument: true,
        requirements: {
            arguments: ['remote name', 'remote url'],
            message:
                '--add-remote=<remote name> <remote url> \n eg. --add-remote="pws https://github.com/Possible-bj/darsh.com.ng-repo.git"',
        },
        action(remoteName, remoteUrl) {
            return `git remote add ${remoteName} ${remoteUrl}`;
        },
    },
    '--rm-remote': {
        requireArgument: true,
        requirements: {
            arguments: ['remote name'],
            message: '--rm-remote=<remote name> \n eg. --rm-remote=pws',
        },
        action(remoteName) {
            return `git remote remove ${remoteName}`;
        },
    },
    '--add': {
        requireArgument: true,
        requirements: {
            arguments: ['file path'],
            message: '--add=<file path> \n eg. --add=.',
        },
        action(filePath) {
            return `git add ${filePath}`;
        },
    },
    '--commit': {
        requireArgument: true,
        requirements: {
            arguments: ['commit message'],
            message:
                '--commit=<commit message> \n eg. --commit="commit message"',
        },
        action(commitMessage) {
            return `git commit -m "${commitMessage}"`;
        },
    },
    '--pull': {
        requireArgument: false,
        requirements: {
            arguments: ['remote name', 'branch name'],
            message:
                '--pull=<remote name> <branch name> \n eg. --pull="origin main"',
        },
        action([remoteName = null, branchName = null]) {
            if (remoteName && !branchName) {
                throw new Error(
                    `${this.requirements.message} : branch name is missing`,
                );
            }
            if (!remoteName && branchName) {
                throw new Error(
                    `${this.requirements.message} : remote name is missing`,
                );
            }

            return `git pull ${remoteName ? `${remoteName}` : ''} ${
                branchName ? `${branchName}` : ''
            }`;
        },
    },
    '--push': {
        requireArgument: false,
        requirements: {
            arguments: ['remote name', 'branch name'],
            message:
                '--push=<remote name> <branch name> \n eg. --push="origin main"',
        },
        action([remoteName = null, branchName = null]) {
            if (remoteName && !branchName) {
                throw new Error(
                    `${this.requirements.message} : branch name is missing`,
                );
            }
            if (!remoteName && branchName) {
                throw new Error(
                    `${this.requirements.message} : remote name is missing`,
                );
            }

            return `git push ${remoteName ? `${remoteName}` : ''} ${
                branchName ? `${branchName}` : ''
            }`;
        },
    },
};
const allowedFlags = [
    '--init',
    '--branch',
    '--checkout',
    '--add-remote',
    '--rm-remote',
    '--add',
    '--commit',
    '--pull',
    '--push',
];
const runCommand = (command) => {
    exec(command, (error, stdout, stderr) => {
        console.log(`\n${command}`);
        if (error) {
            console.error(`Error executing Git command: ${error}`);
            return;
        }

        console.log(`Git ${command} command output: ${stdout}`);
    });
};
const argvs = process.argv.splice(2);

const startGitProcess = () => {
    const operations = argvs.map((argv) => argv.split('=')[0]?.toLowerCase());
    // ='name remote'
    // console.log('operations >>', operations);
    const flagValidation = operations.map((flag) => {
        if (!allowedFlags.includes(flag.trim())) {
            return {
                flag,
                isValid: false,
            };
        }

        return {
            flag,
            isValid: true,
        };
    });

    const invalidFlags = flagValidation.filter((flag) => !flag.isValid);

    if (invalidFlags.length) {
        const errorMessage = invalidFlags
            .map((flag) => `${flag.flag} is not recognised as internal command`)
            .join(', ');

        throw new Error(errorMessage);
    }

    const gitCommand = {
        // "--push": ["git push origin main", "git push origin pws"],
    };

    for (const flag of argvs) {
        const [key, value] = flag.split('=');
        const flagConfig = flagConfigMap[key];
        // console.log('flagConfig >>', flagConfig);
        if (!flagConfig) {
            throw new Error(
                `Flag ${key} is not recognised as internal command`,
            );
        }
        if (flagConfig.requireArgument) {
            if (!value) {
                throw new Error(
                    `Argument is required: ${flagConfig.requirements.message}`,
                );
            }

            if (flagConfig.requirements.arguments.length > 1) {
                const values = value.split(' ');
                if (
                    values.length !== flagConfig.requirements.arguments.length
                ) {
                    throw new Error(
                        `Invalid number of arguments: ${flagConfig.requirements.message}`,
                    );
                }
                if (gitCommand.hasOwnProperty(key)) {
                    if (gitCommand[key].length) {
                        gitCommand[key] = gitCommand[key].concat(
                            flagConfig?.action(...values),
                        );
                    } else {
                        gitCommand[key] = [flagConfig?.action(...values)];
                    }
                } else {
                    gitCommand[key] = [flagConfig?.action(...values)];
                }
            } else {
                if (gitCommand.hasOwnProperty(key)) {
                    if (gitCommand[key].length) {
                        gitCommand[key] = gitCommand[key].concat(
                            flagConfig?.action(value),
                        );
                    } else {
                        gitCommand[key] = [flagConfig?.action(value)];
                    }
                } else {
                    gitCommand[key] = [flagConfig?.action(value)];
                }
            }
        } else {
            const values = value.split(' ');

            if (gitCommand.hasOwnProperty(key)) {
                if (gitCommand[key].length) {
                    gitCommand[key] = gitCommand[key].concat(
                        flagConfig?.action(values?.length ? values : null),
                    );
                } else {
                    gitCommand[key] = [
                        flagConfig?.action(values?.length ? values : null),
                    ];
                }
            } else {
                gitCommand[key] = [
                    flagConfig?.action(values?.length ? values : null),
                ];
            }
        }

        // console.log('key', key);
        // console.log('value', value);
    }
    console.log('gitCommand >>', gitCommand);

    if (Object.keys(gitCommand).length === 0) {
        throw new Error('No command to execute');
    }
    Object.keys(gitCommand).forEach((key) => {
        for (const command of gitCommand[key]) {
            console.log('command >>', command);
            runCommand(command);
        }
    });
};

const main = () => {
    try {
        startGitProcess();
    } catch (error) {
        console.error('Error executing Git command:', error);
    }
};

main();

// git checkout master && git pull origin master && yarn build && git add . && git commit -m "Build Master" && git push origin master && git checkout wireframe && git merge master && git push origin wireframe
