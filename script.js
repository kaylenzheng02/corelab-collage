document.addEventListener('DOMContentLoaded', () => {
    const pitches = [
        523.25, 587.33, 659.25, 698.46, 783.99, 880.00,
        987.77, 1046.50, 1174.66, 1318.51, 1567.98
    ];

    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playTwinkle(frequency) {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const duration = 0.9;

        const master = ctx.createGain();
        master.gain.setValueAtTime(0, now);
        master.gain.linearRampToValueAtTime(0.35, now + 0.005);
        master.gain.exponentialRampToValueAtTime(0.12, now + 0.12);
        master.gain.exponentialRampToValueAtTime(0.001, now + duration);
        master.connect(ctx.destination);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(8, now);
        lfoGain.gain.setValueAtTime(0.15, now);
        lfo.connect(lfoGain);
        lfoGain.connect(master.gain);
        lfo.start(now);
        lfo.stop(now + duration);

        const partials = [
            { mult: 1,   gain: 0.55, type: 'sine', decay: 0.85 },
            { mult: 2,   gain: 0.28, type: 'sine', decay: 0.55 },
            { mult: 3.01, gain: 0.12, type: 'sine', decay: 0.35 },
            { mult: 4.2,  gain: 0.08, type: 'triangle', decay: 0.22 }
        ];

        partials.forEach(({ mult, gain, type, decay }) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(frequency * mult, now);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(gain, now + 0.008);
            g.gain.exponentialRampToValueAtTime(0.001, now + decay);
            osc.connect(g);
            g.connect(master);
            osc.start(now);
            osc.stop(now + duration);
        });
    }

    // NASA JWST Flickr: https://www.flickr.com/photos/nasawebbtelescope/
    const WEBB_FLICKR_NSID = '50785054@N03';
    // NASA Hubble Flickr: https://www.flickr.com/photos/nasahubble/
    const HUBBLE_FLICKR_NSID = '144614754@N02';

    const flickrFeeds = {
        webb: { nsid: WEBB_FLICKR_NSID, photos: [], loading: null, nextIndex: 0, alt: 'James Webb Space Telescope' },
        hubble: { nsid: HUBBLE_FLICKR_NSID, photos: [], loading: null, nextIndex: 0, alt: 'NASA Hubble Space Telescope' }
    };

    const layer = document.getElementById('webb-layer');

    function flickrUrl(mediaUrl) {
        return mediaUrl.replace(/_m(\.\w+)$/, '_n$1');
    }

    function loadFlickrPhotos(feed) {
        if (feed.photos.length) return Promise.resolve(feed.photos);
        if (feed.loading) return feed.loading;

        feed.loading = new Promise((resolve, reject) => {
            const callbackName = 'jsonFlickrFeed_' + Date.now() + '_' + feed.nsid.replace(/\W/g, '');
            const script = document.createElement('script');

            const cleanup = () => {
                delete window[callbackName];
                if (script.parentNode) script.parentNode.removeChild(script);
            };

            window[callbackName] = (data) => {
                cleanup();
                feed.photos = (data && data.items) ? data.items : [];
                feed.loading = null;
                if (!feed.photos.length) {
                    reject(new Error('No Flickr photos found'));
                    return;
                }
                resolve(feed.photos);
            };

            script.onerror = () => {
                cleanup();
                feed.loading = null;
                reject(new Error('Failed to load Flickr feed'));
            };

            script.src =
                'https://www.flickr.com/services/feeds/photos_public.gne' +
                '?id=' + encodeURIComponent(feed.nsid) +
                '&lang=en-us&format=json&jsoncallback=' + callbackName;

            document.body.appendChild(script);
        });

        return feed.loading;
    }

    function placeRandomly(img) {
        const maxLeft = 72;
        const maxTop = 70;
        img.style.left = Math.random() * maxLeft + '%';
        img.style.top = Math.random() * maxTop + '%';
    }

    function clearFlickrImages() {
        layer.innerHTML = '';
    }

    async function addFlickrImage(feed) {
        try {
            const photos = await loadFlickrPhotos(feed);
            const item = photos[feed.nextIndex % photos.length];
            feed.nextIndex += 1;

            const img = document.createElement('img');
            img.src = flickrUrl(item.media.m);
            img.alt = item.title || feed.alt;
            img.loading = 'lazy';
            placeRandomly(img);

            layer.appendChild(img);
        } catch (err) {
            console.error(err);
        }
    }

    loadFlickrPhotos(flickrFeeds.webb).catch(() => {});
    loadFlickrPhotos(flickrFeeds.hubble).catch(() => {});

    document.querySelectorAll('.redbox').forEach((box, index) => {
        box.addEventListener('click', () => {
            playTwinkle(pitches[index]);

            if (box.dataset.name === 'EC 90') {
                addFlickrImage(flickrFeeds.webb);
            } else if (box.dataset.name === 'EC 82') {
                addFlickrImage(flickrFeeds.hubble);
            } else if (box.dataset.name === 'EC 53') {
                clearFlickrImages();
            } else if (box.dataset.name === 'SMM 1') {
                window.location.href = 'smm1/smm1.html';
            } else if (box.dataset.name === 'HBC 672') {
                window.location.href = 'hbc672/hbc672.html';
            } else if (box.dataset.name === 'OO Ser') {
                window.location.href = 'serpens/serpens.html';
            }
        });
    });
});
