import prompts from "prompts";
import { templateData } from "./template";
import fs from 'fs';
import degit from 'degit';
import path from 'path';
import { bold, gray, green } from 'kleur/colors';
import { spawn } from 'child_process';

/**
 * Run the command line interface program.
 * @param argv process.argv.
 */
export const cli = () => {
    (async () => {
        console.log(gray(`\nTurbo Search Installer`))

        const choiceTemplate = (await prompts({
            type: 'select',
            name: 'template',
            message: 'Which template do you want to use?',
            choices: templateData.map((template) => ({
                title: template.name,
                value: template.name,
            })),
            initial: 0,
        })).template;

        if (!choiceTemplate) {
            throw new Error('No template selected')
        }

        const inputApiKey = (await prompts({
            type: 'text',
            name: 'apiKey',
            message: 'What is your OpenAI API key?',
        })).apiKey;

        if (!inputApiKey) {
            throw new Error('API key was not entered')
        }

        if (!templateData.find((t) => t.name === choiceTemplate)) {
            throw new Error(`Invalid template selected: ${choiceTemplate}`)
        }
        const template = templateData.filter((t) => t.name === choiceTemplate)[0];

        const choicePackageManager = (await prompts({
            type: 'select',
            name: 'packageManager',
            message: 'Which package manager do you want to use?',
            choices: [
                { title: 'yarn', value: 'yarn' },
                { title: 'npm', value: 'npm' },
            ],
            initial: 0,
        })).packageManager;

        if (!choicePackageManager) {
            throw new Error('No package manager selected')
        }

        //Create a folder for installation
        if (fs.existsSync("turbo-search")) {
            if (fs.readdirSync("turbo-search").length > 0) {
                const response = await prompts({
                    type: 'confirm',
                    name: 'value',
                    message: 'Directory not empty. Continue?',
                    initial: false,
                })
                if (!response.value) {
                    process.exit(1)
                }
                fs.rmdirSync("turbo-search", { recursive: true })
            }
        } else {
            mkdirp("turbo-search")
        }

        console.log("Downloading template...")

        await new Promise((res, rej) => {
            const emitter = degit(
                `${template.github.user}/${template.github.repository}/${template.github.directory}/${template.github.templateName}#main`,
                {
                    cache: false,
                    force: true,
                }
            )

            emitter.on('info', (info) => {
                console.log(info.message)
            })

            emitter.clone(path.join(process.cwd(), "turbo-search")).then(() => {
                res({})
            })
        })

        console.log("Installing dependencies...")

        if (choicePackageManager === "yarn") {
            await (new Promise((resolve, reject) => {
                const yarn = spawn('yarn.cmd', [], { cwd: './turbo-search' });

                yarn.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });

                yarn.stderr.on('data', (data) => {
                    console.error(`stderr: ${data}`);
                });

                yarn.on('close', (code) => {
                    if (code === 0) {
                        resolve(true);
                    } else {
                        reject(new Error(`Yarn install exited with code ${code}`));
                    }
                });
            }));
        } else if (choicePackageManager === "npm") {
            await (new Promise((resolve, reject) => {
                const npm = spawn('npm.cmd', ['install'], { cwd: './turbo-search' });

                npm.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });

                npm.stderr.on('data', (data) => {
                    console.error(`stderr: ${data}`);
                });

                npm.on('close', (code) => {
                    if (code === 0) {
                        resolve(true);
                    } else {
                        reject(new Error(`NPM install exited with code ${code}`));
                    }
                });
            }));
        } else {
            throw new Error("Invalid package manager")
        }

        console.log("Writing .env file...")
        mkdirp(path.join(process.cwd(), "turbo-search", path.dirname(template.envPath)))
        fs.writeFileSync(path.join(process.cwd(), "turbo-search", template.envPath), template.env(inputApiKey))

        console.log(bold(green('✔ Turbo Search was successfully installed.')))
    })();
};

function mkdirp(dir: string) {
    try {
        fs.mkdirSync(dir, { recursive: true })
    } catch (e: any) {
        if (e.code === 'EEXIST') return
        throw e
    }
}
