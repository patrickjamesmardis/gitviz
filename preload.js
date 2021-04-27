const d3 = require('d3');
const { ipcRenderer } = require('electron');
let gits;

ipcRenderer.invoke('get', 'gits').then(res => {
    gits = res;
});

function gitviz(dirname) {
    d3.select('section#main').style('display', 'none');
    d3.select('section#gitviz').style('display', 'flex');

    ipcRenderer.invoke('gitlog', dirname).then(res => {
        d3.select('section#gitviz')
            .selectAll('div.commit').data(res).enter()
            .append('div').classed('commit', true);
        d3.selectAll('div.commit').data(res)
            .append('p').classed('timestamp', true).text(d => d.authorDate);
        d3.selectAll('div.commit').data(res)
            .append('div').classed('circle', true)
            .html(d => d.abbrevHash).transition().style('opacity', 1);
        d3.selectAll('div.commit').data(res)
            .append('p').classed('message', true).html(d => `"${d.subject}"`);
        d3.selectAll('div.commit').data(res)
            .append('p').classed('author', true).html(d => `-- ${d.authorName}`);
        d3.selectAll('div.commit').data(res)
            .append('div').classed('files', true).append('div').classed('statuses', true)
            .selectAll('p').data(d => d.status).enter()
            .append('p').html(d => d)
            .style('color', d => d == 'M' ? '#33658A' : d == 'A' ? '#628B48' : '#925E78')
        d3.selectAll('div.files').data(res)
            .append('div').classed('names', true)
            .selectAll('p').data(d => d.files).enter()
            .append('p').html(d => d)
    });
}

ipcRenderer.on('touchbar', (e, m) => {
    gitviz(m)
});

window.addEventListener('DOMContentLoaded', () => {
    const emojiPicker = document.querySelector('emoji-picker');
    let currEmoji = null;
    function openEmojiListener(e) {
        emojiPicker.style.display = 'block';
        let xOff = 30;
        let yOff = 30;
        if (e.clientX + emojiPicker.clientWidth >= window.innerWidth) xOff = -1 * emojiPicker.clientWidth - 30;
        if (e.clientY + emojiPicker.clientHeight >= window.innerHeight) yOff = -1 * emojiPicker.clientWidth - 30;
        emojiPicker.style.transform = `translate(${e.clientX + xOff}px, ${e.clientY + yOff}px)`;
        currEmoji = e.target;
        emojiPicker.addEventListener('emoji-click', updateEmojiListener);
        document.querySelector('#main').addEventListener('click', closeEmojiListener);
    }
    function closeEmojiListener(e) {
        if (!e.target.classList.contains('emoji')) {
            emojiPicker.style.display = 'none';
            emojiPicker.removeEventListener('emoji-click', updateEmojiListener);
            document.querySelector('#main').removeEventListener('click', closeEmojiListener);
        }
    }
    function updateEmojiListener(e) {
        if (emojis.includes(e.detail.unicode)) {
            window.alert(`${e.detail.unicode} is already in use by ${gits[emojis.indexOf(e.detail.unicode)].name}`);
        } else {
            let old = currEmoji.innerHTML;
            currEmoji.innerHTML = e.detail.unicode;
            ipcRenderer.invoke('updateEmoji', [gits[emojis.indexOf(old)].path, e.detail.unicode, old]);
            emojis[emojis.indexOf(old)] = e.detail.unicode;
        }
    }
    d3.select('#main')
        .selectAll('div.dir').data(gits).enter()
        .append('div').classed('dir', true)
        .append('p').classed('dirname', true)
        .html(d => d.name).on('click', (e, d) => gitviz(d.path))
    d3.selectAll('div.dir').data(gits).append('div').classed('emoji', true)
        .text(d => d.emoji)
        .on('click', e => openEmojiListener(e));
});