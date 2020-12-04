# Mokue 🍰

We are also introducing a simple mock server to optionally use with the proxy configuration.


### How to get it?

Install using yarn or yarn with `yarn add mokue`

### How to use it?

Simply run `mokue` from the terminal with the config file (default: mokue.config.js) in the working directory.

**mokue.config.js**

```javascript
module.exports = {
    target: 'http://website.api',
    route: {
        'GET /apis/get_data': {
            data: 'mock/mock.json',
            delay: 10000,
        },
        'POST /api/get_details': {
            data: () => {
                return ['application/json', '{}']
            }
        }
    }
}
```



#### Configuration Parameters

- **Target** - The target API to fallback to in case the route is not defined 
- **Route** - The route configurations with the format of [Method] [Route Path]
  - **Data** <string | function> - The local file for the mock data or function to generate the data
  - **Delay** <number | function> - The delay in milliseconds



### Future Versions

In the future versions, Mokue will support: 

- Generating data from mock json files
- Support delaying proxied request
