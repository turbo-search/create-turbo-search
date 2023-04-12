export const templateData: {
    id: string,
    name: string,
    //degit ${github.user}}/${github.repository}/${github.directory}/${github.templateName}
    github: {
        user: string,
        repository: string,
        directory: string,
        templateName: string
    },
    envPath: string,
    env: (apiKey: string) => string,
}[] = [
        {
            id: 'default',
            name: 'Default',
            github: {
                user: 'turbo-search',
                repository: 'starter',
                directory: 'templates',
                templateName: 'default'
            },
            envPath: './packages/backend/.env.local',
            env: (apiKey: string) => `OPENAI_API_KEY="${apiKey}"`
        }
    ];