// src/components/report/fonts.js
// Türkçe karakter desteği için Roboto font kaydı

import { Font } from '@react-pdf/renderer';

// Google Fonts'tan Roboto yükle
Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf',
            fontWeight: 'normal'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf',
            fontWeight: 'bold'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu52xPKTM1K9nz.ttf',
            fontWeight: 'medium'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu51xIIzc.ttf',
            fontStyle: 'italic'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1Mu51TzBhc9AMX6lJBP.ttf',
            fontWeight: 'bold',
            fontStyle: 'italic'
        }
    ]
});

export default 'Roboto';
