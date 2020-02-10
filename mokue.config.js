module.exports = {
    target: 'http://space.test.shopee.io',
    route: {
        'GET /apis/cmdb/v1/service/get': {
            data: 'mock/mock.json'
        },
        'GET /api/get_details': {
            data: 'mock/file.json'
        }
    }
}
