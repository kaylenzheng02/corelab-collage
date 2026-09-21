document.addEventListener('DOMContentLoaded', () => {
    const IMAGE_URL = 'https://cdn.esahubble.org/archives/images/screen/heic1819c.jpg';

    A.init.then(() => {
        const aladin = A.aladin('#aladin-lite-div', {
            target: '18 29 51.65 +01 15 49.52',
            fov: 2.2,
            cooFrame: 'ICRS',
            projection: 'SIN',
            showFullscreenControl: true,
            showZoomControl: true,
            showLayersControl: true,
            showFrame: true,
            reticleColor: 'rgb(242, 242, 242)',
            gridColor: 'rgb(220, 220, 220)'
        });

        aladin.setDefaultColor('#f2f2f2');
        aladin.setBaseImageLayer('P/DSS2/color');

        aladin.displayJPG(IMAGE_URL, null, (ra, dec, fov) => {
            if (Number.isFinite(ra) && Number.isFinite(dec)) {
                aladin.gotoRaDec(ra, dec);
            }
            if (Number.isFinite(fov) && fov > 0) {
                aladin.setFoV(fov);
            }
        });

        const setOverlayAlpha = (value) => {
            const overlay = aladin.getOverlayImageLayer && aladin.getOverlayImageLayer();
            if (overlay && typeof overlay.setAlpha === 'function') {
                overlay.setAlpha(Number(value));
            }
        };

        document.querySelectorAll('input[name="survey"]').forEach((input) => {
            input.addEventListener('change', () => {
                if (input.checked) {
                    aladin.setImageSurvey(input.value);
                }
            });
        });

        const alphaSlider = document.getElementById('overlay-alpha');
        alphaSlider.addEventListener('input', () => {
            setOverlayAlpha(alphaSlider.value);
        });
    });
});
