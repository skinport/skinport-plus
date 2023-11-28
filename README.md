# Skinport Plus

> Enhance your online trading experience on Skinport and Steam with Skinport Plus.

## Install

[link-chrome]: https://chrome.google.com/webstore/detail/skinport-plus/lmaokgcdiccpfgacillojaojkfpdfeej 'Version published on Chrome Web Store'
[link-firefox]: https://addons.mozilla.org/firefox/addon/skinport-plus/ 'Version published on Mozilla Add-ons'

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/chrome/chrome.svg" width="48" alt="Chrome" valign="middle">][link-chrome] [<img valign="middle" src="https://img.shields.io/chrome-web-store/v/lmaokgcdiccpfgacillojaojkfpdfeej.svg?label=%20">][link-chrome] and other Chromium browsers

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/firefox/firefox.svg" width="48" alt="Firefox" valign="middle">][link-firefox] [<img valign="middle" src="https://img.shields.io/amo/v/skinport-plus.svg?label=%20">][link-firefox] including Firefox Android

## Development

#### Clone repository and install npm dependencies

```sh
git clone https://github.com/skinport/skinport-plus.git
cd skinport-plus
npm install
```

#### Build the extension into a `dist` folder, listen for file changes and automatically rebuild

```sh
npm run dev # Build for Chrome
npm run dev:firefox # Build for Firefox
```

#### Load into the browser

##### Automatic

```sh
npm run load # Load in Chrome
npm run load:firefox # Load in Firefox
```

##### Manual

<table>
  <tr>
    <th>Chrome</th>
    <th>Firefox</th>
  </tr>
  <tr>
    <td width="50%">
      <ol>
        <li>Open <code>chrome://extensions</code>.</li>
        <li>Check the <i>Developer mode</i> checkbox.</li>
        <li>Click on <i>Load unpacked extension</i>.</li>
        <li>Select the <code>dist</code> folder.</li>
      </ol>
    </td>
    <td width="50%">
      <ol>
        <li>Open <code>about:debugging#addons</code>.</li>
        <li>Click on <i>Load Temporary Add-on</i>.</li>
        <li>Select the <code>dist/manifest.json</code> file.</li>
      </ol>
    </td>
  </tr>
</table>

#### Build the extension into a `dist` folder

```sh
npm run build # Build for Chrome
npm run build:firefox # Build for Firefox
```

## Releasing

A release workflow in GitHub actions will automatically build, version, create a tag and release on GitHub, Chrome Web Store and Add-ons for Firefox.

##### On GitHub

1. Go to the repository [release workflow](https://github.com/skinport/skinport-plus/actions/workflows/release.yml) in actions
1. Run the workflow with `Run workflow`

##### With GitHub CLI

```sh
gh workflow run release.yml
```