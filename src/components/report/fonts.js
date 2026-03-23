// src/components/report/fonts.js
// Türkçe karakter desteği için Roboto font kaydı

import { Font } from '@react-pdf/renderer';

// Google Fonts'tan Roboto yükle
Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: 'https://cdn.jsdelivr.net/gh/googlefonts/roboto@master/src/hinted/Roboto-Regular.ttf',
            fontWeight: 'normal'
        },
        {
            src: 'https://cdn.jsdelivr.net/gh/googlefonts/roboto@master/src/hinted/Roboto-Bold.ttf',
            fontWeight: 'bold'
        },
        {
            src: 'https://cdn.jsdelivr.net/gh/googlefonts/roboto@master/src/hinted/Roboto-Medium.ttf',
            fontWeight: 'medium'
        },
        {
            src: 'https://cdn.jsdelivr.net/gh/googlefonts/roboto@master/src/hinted/Roboto-Italic.ttf',
            fontStyle: 'italic'
        },
        {
            src: 'https://cdn.jsdelivr.net/gh/googlefonts/roboto@master/src/hinted/Roboto-BoldItalic.ttf',
            fontWeight: 'bold',
            fontStyle: 'italic'
        }
    ]
});

export default 'Roboto';
