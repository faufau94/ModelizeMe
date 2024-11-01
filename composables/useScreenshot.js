import { toJpeg as ElToJpg, toPng as ElToPng } from 'html-to-image';
import { ref } from 'vue';

export function useScreenshot() {
    const dataUrl = ref('');
    const imgType = ref('png');
    const error = ref();

    async function capture(el, options = {}, modelName) {
        let data;

        const fileName = options.fileName ?? `${modelName.replace(' ','-')}-screenshot-${Date.now()}`;

        // Définir le filtre pour exclure certains éléments de la capture
        const filter = (node) => {
            // Exclure les éléments qui ont la classe 'vue-flow__panel' ou toute autre classe spécifique
            const exclusionClasses = ['vue-flow__panel'];
            return !exclusionClasses.some((classname) => node.classList?.contains(classname));
        };

        const imageOptions = {
            ...options,
            filter,
        };

        switch (options.type) {
            case 'jpeg':
                data = await toJpeg(el, imageOptions);
                break;
            case 'png':
                data = await toPng(el, imageOptions);
                break;
            default:
                data = await toPng(el, imageOptions);
                break;
        }

        // Télécharger immédiatement l'image si shouldDownload est vrai
        if (options.shouldDownload && fileName !== '') {
            download(fileName, options.type);
        }

        return data;
    }

    function toJpeg(el, options = { quality: 0.95 }) {
        error.value = null;

        return ElToJpg(el, options)
            .then((data) => {
                dataUrl.value = data;
                imgType.value = 'jpeg';
                return data;
            })
            .catch((err) => {
                error.value = err;
                throw new Error(err);
            });
    }

    function toPng(el, options = { quality: 0.95 }) {
        error.value = null;

        return ElToPng(el, options)
            .then((data) => {
                dataUrl.value = data;
                imgType.value = 'png';
                return data;
            })
            .catch((err) => {
                error.value = err;
                throw new Error(err);
            });
    }

    function download(fileName, type) {
        const link = document.createElement('a');
        link.download = `${fileName}.${type}`;
        link.href = dataUrl.value;
        link.click();
    }

    function exportAsImage(el, type, modelName) {
        capture(el, { type: type, shouldDownload: true }, modelName);
    }

    return {
        capture,
        download,
        dataUrl,
        error,
        exportAsImage,
    };
}
