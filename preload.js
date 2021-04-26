const d3 = require('d3');
const { ipcRenderer } = require('electron');
let gits;
let emojis;

ipcRenderer.invoke('get', 'gits').then(res => {
    gits = res;
});
ipcRenderer.invoke('get', 'emojis').then(res => {
    emojis = res;
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
    function gitviz(e, d) {
        console.log(e);
        d3.select('section#main').transition().style('opacity', 0);
        d3.select('section#gitviz').style('display', 'block');
        d3.select('section#terminal').transition().style('height', `${0.3 * window.innerHeight}px`).select('p').text(`${d.name} >`);
        let gitlog;
        ipcRenderer.invoke('gitlog', d.path).then(res => {
            gitlog = res;
            console.log(gitlog);
        });

    }
    d3.select('#main')
        .selectAll('div.dir').data(gits).enter()
        .append('div').classed('dir', true)
        .on('click', (e, d) => gitviz(e, d))
        .text(d => d.name)
        .append('div').classed('emoji', true)
        .text((d, i) => emojis[i])
        .on('click', e => openEmojiListener(e));
});