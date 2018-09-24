#!/usr/bin/env node
import simpleGit from 'simple-git/promise';
import showdown from 'showdown';
import fs from 'fs';

const keyWord = 'CHANGELOG.md';
const startChar = '+';
console.log(__dirname);
const git = simpleGit(__dirname);

git.log()
    .then(log => log.all.map(commit => commit.hash))
    .then((commitHashes) => git.diff([commitHashes[15], commitHashes[0]]))
    .then(diff => buildData(diff))
    .then(changes => renderOutput(changes))
    .then(html => fs.appendFile('global-changelog.html', html, 'utf8', (err) => {
        if (err) throw err;
        console.log('The "data to append" was appended to file!');
    }));


const buildData = (rawDiff) => {
    const filterChangelogFromDiff = diff => {
        const filesDiff = diff.split('diff --git');
        const filtered = filesDiff
            .filter(fileDiff => fileDiff.split('\n')[0].includes(keyWord))
            .map(fileDiff => fileDiff
                .split('\n')
                .filter(line => line.includes(keyWord) || line.startsWith(startChar)));
        return filtered;
    };
    const fileChange = fileDiff => {
        const packageName = fileDiff[0].match(/packages\/(.+?)\//)[1];
        const changes = fileDiff.slice(3).map(line => line.substring(1)).join('\n');
        return {
            packageName,
            changes
        }
    };
    return new Promise((resolve, reject) => {
        const filteredDiff = filterChangelogFromDiff(rawDiff);
        resolve(filteredDiff.map(fileDiff => fileChange(fileDiff)));
    });
};

const renderOutput = data => {
    return new Promise((resolve, reject) => {
        const mdConverter = new showdown.Converter();
        const output = data.map(obj => {
            return [`<h2>Package ${obj.packageName}</h2>`,
                mdConverter.makeHtml(obj.changes)].join('\n')
        }).join('<br>');
        resolve(output);
    })
};