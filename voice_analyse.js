// クロスブラウザ定義
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// 変数定義
var localMediaStream = null;
var localScriptProcessor = null;
var audioContext;
var bufferSize = 1024;
var audioData = []; // 録音データ
var recordingFlg = false;

// キャンバス
var canvasFrequency = document.querySelector('#canvasFrequency');
var canvas_F_Context = canvasFrequency.getContext('2d');

var canvasTimeDomain = document.querySelector('#canvasTimeDomain');
var canvas_T_Context = canvasTimeDomain.getContext('2d');


window.addEventListener("load", () => {
    document.querySelector("#TitleWindow").addEventListener("click", startRecording);
});



// 録音バッファ作成（録音中自動で繰り返し呼び出される）
const onAudioProcess = (e) => {
    if (!recordingFlg) {
        return;
    }
    // 音声のバッファを作成
    let input = e.inputBuffer.getChannelData(0);
    let bufferData = new Float32Array(bufferSize);
    for (var i = 0; i < bufferSize; i++) {
        bufferData[i] = input[i];
    }
    audioData.push(bufferData);

    // 波形を解析
    analyseVoice();
};

// 解析用処理
const analyseVoice = () => {
    let fsDivN = audioContext.sampleRate / audioAnalyser.fftSize;      //周波数分解能
    let spectrums = new Uint8Array(audioAnalyser.frequencyBinCount);   //周波数領域の振幅データ格納用配列を生成
    audioAnalyser.getByteFrequencyData(spectrums);                     //周波数領域の振幅データを配列に格納

    let timeDomainArray = new Uint8Array(audioAnalyser.fftSize);       //時間領域の振幅データ格納用配列を生成
    audioAnalyser.getByteTimeDomainData(timeDomainArray);              //時間領域の振幅データを配列に格納

    canvas_F_Context.clearRect(0, 0, canvasFrequency.width, canvasFrequency.height);
    canvas_F_Context.beginPath();

    for (var i = 0, len = spectrums.length; i < len; i++) {
        //canvasにおさまるように線を描画
        let x = (i / len) * canvasFrequency.width;
        let y = (1 - (spectrums[i] / 255)) * canvasFrequency.height;
        if (i === 0) {
            canvas_F_Context.moveTo(x, y);
        } else {
            canvas_F_Context.lineTo(x, y);
        }
        let f = Math.floor(i * fsDivN);  // index -> frequency;

        // 500 Hz単位にy軸の線とラベル出力
        if ((f % 500) === 0) {
            let text = (f < 1000) ? (f + ' Hz') : ((f / 1000) + ' kHz');
            // Draw grid (X)
            canvas_F_Context.fillRect(x, 0, 1, canvasFrequency.height);
            // Draw text (X)
            canvas_F_Context.fillText(text, x, canvasFrequency.height);
        }
    }
    canvas_F_Context.stroke();

    // x軸の線とラベル出力
    let textYs = ['1.00', '0.50', '0.00'];
    for (var i = 0, len = textYs.length; i < len; i++) {
        let text = textYs[i];
        let gy = (1 - parseFloat(text)) * canvasFrequency.height;
        // Draw grid (Y)
        canvas_F_Context.fillRect(0, gy, canvasFrequency.width, 1);
        // Draw text (Y)
        canvas_F_Context.fillText(text, 0, gy);
    }


    canvas_T_Context.clearRect(0, 0, canvasTimeDomain.width, canvasTimeDomain.height);
    canvas_T_Context.beginPath();
    for (var i = 0, len = timeDomainArray.length; i < len; i++) {
        //canvasにおさまるように線を描画
        let x = (i / len) * canvasTimeDomain.width;
        let y = (1 - (timeDomainArray[i] / 255)) * canvasTimeDomain.height;
        if (i === 0) {
            canvas_T_Context.moveTo(x, y);
        } else {
            canvas_T_Context.lineTo(x, y);
        }
        var f = Math.floor(i * fsDivN);  // index -> frequency;

        // 500 Hz単位にy軸の線とラベル出力
        // if ((f % 500) === 0) {
        //     var text = (f < 1000) ? (f + ' Hz') : ((f / 1000) + ' kHz');
        //     // Draw grid (X)
        //     canvas_T_Context.fillRect(x, 0, 1, canvasTimeDomain.height);
        //     // Draw text (X)
        //     canvas_T_Context.fillText(text, x, canvasTimeDomain.height);
        // }
    }
    canvas_T_Context.stroke();
}



// 解析開始
const startRecording = function () {
    audioContext = new AudioContext();
    recordingFlg = true;
    navigator.getUserMedia({ audio: true }, function (stream) {
        // 録音関連
        localMediaStream = stream;
        let scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
        localScriptProcessor = scriptProcessor;
        let mediastreamsource = audioContext.createMediaStreamSource(stream);
        mediastreamsource.connect(scriptProcessor);
        scriptProcessor.onaudioprocess = onAudioProcess;
        scriptProcessor.connect(audioContext.destination);

        // 音声解析関連
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 2048;
        frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
        timeDomainData = new Uint8Array(audioAnalyser.frequencyBinCount);
        mediastreamsource.connect(audioAnalyser);
    },
        function (e) {
            console.log(e);
        });
};

// 解析終了
const endRecording = function () {
    recordingFlg = false;

    //audioDataをサーバに送信するなど終了処理
};