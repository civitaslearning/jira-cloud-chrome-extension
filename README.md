<img src="src/assets/img/icon-128.png" width="64"/>

# A Chrome Browser Extension (MV3) that extends Jira Cloud Functionality

## Features

- Colorizes board and backlog cards
- Adds Quickfilters to board and backlog views
- Adds alerts to board and backlog cards
- Support for markdown in the Sprint Goal

## Installing a Release

To just install this extension you may do the following:

1. Download the extension `releases` folder by browsing to:  
   https://download-directory.github.io/?url=https%3A%2F%2Fgithub.com%2Fcivitaslearning%2Fjira-cloud-chrome-extension%2Ftree%2Fmaster%2Freleases)
2. Unzip the downloaded file
3. In Chrome, browse to `chrome://extensions/`
4. Check `Developer mode`
5. Click on `Load unpacked extension`
6. In the `Select the extension directory` dialog browse to the directory you unzipped in step 2 and select the version you want to install

## Development

1. Ensure your [Node.js](https://nodejs.org/) version is >= **18**.
2. Clone this repository.
3. Run `npm install --legacy-peer-deps` to install the dependencies.
4. Run `npm run build`
5. In Chrome, browse to `chrome://extensions/`
6. Check `Developer mode`
7. Click on `Load unpacked extension`
8. Select the `build` folder.

## Developer Resources

- [Chrome Extension Documentation](https://developer.chrome.com/extensions/getstarted)
- [Jira REST API documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3)
- - Example request: [https://civitaslearning.atlassian.net/rest/api/3/issue/DOPE-206]
- [Boiler Plate Extension Documentation](https://github.com/lxieyang/chrome-extension-boilerplate-react/blob/master/README.md)
- [Webpack Documentation](https://webpack.js.org/concepts/)
