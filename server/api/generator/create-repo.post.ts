const createRepository = async (url, method, body, headers) => {
    return await $fetch(url, {
        method,
        body,
        headers,
    });
};

export default defineEventHandler(async (event) => {
    const { provider, projectName, token } = await readBody(event);

    if (!provider || !projectName || !token) {
        throw new Error('Paramètres requis manquants.');
    }

    try {
        let response;
        const headers = {
            Authorization: provider === 'github' ? `token ${token}` : `Bearer ${token}`,
        };
        const body = provider === 'github' ? {
            name: projectName,
            private: true,
        } : {
            name: projectName,
            visibility: 'private',
        };

        switch (provider) {
            case 'github':
                console.log('Creating GitHub repository');
                console.log('token', token);
                console.log('body', body);
                console.log('headers', headers);

                /*
                response = await createRepository('https://api.github.com/user/repos', 'POST', body, {
                    ...headers,
                    Accept: 'application/vnd.github.v3+json',
                });

                 */
                break;
            case 'gitlab':
                response = await createRepository('https://gitlab.com/api/v4/projects', 'POST', body, headers);
                break;
            default:
                throw new Error('Service non supporté');
        }

        return {
            success: true,
            repoUrl: response.html_url || response.web_url,
        };
    } catch (error) {
        return {
            success: false,
            message: error.data?.message || error.message,
        };
    }
});