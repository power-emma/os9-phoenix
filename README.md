# os9-phoenix
### My personal website, inspired by the classic MacOS theme, built using React
As per the "phoenix", this is a revival of a similarly themed project I made in regular JavaScript

React was chosen due to it's component system, allowing any react application to be nested in a window object. It's robust state manager also allowed for easier implementation of features such as and "active window" system and window closing

## Known Issues
- Mobile Clients and Low Resolutions (<720p at 100% scale) and odd aspect ratios suffer from poor scaling on the main page, this will be adressed in a future update
- Windows placed off the page require the user to scroll to get to them, an automatic "snap" feature is in the works

## Run Instructions
- Clone Repo
- Run `npm i` to acquire all dependencies
- Run `npm start` to start development server
- Run `npm-deploy` to push to web server
