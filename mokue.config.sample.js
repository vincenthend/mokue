module.exports = {
    target: 'http://website.api',
    route: {
        'GET /apis/get_data': {
            data: 'mock/mock.json',
            delay: 10000,
        },
        'GET /api/get_details': {
            data: () => {
                return ['application/json', '{}']
            }
        }
    }
}
