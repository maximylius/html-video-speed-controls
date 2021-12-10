javascript: (() => {
    if(window.location.href != window.sessionStorage.getItem("href") || !window.sessionStorage.getItem("t0")) {
        window.VideoSpeedPlugin = {t0: Date.now()};
        window.sessionStorage.setItem(href, window.location.href);
        window.sessionStorage.setItem("t0", Date.now());
    } else {
        window.VideoSpeedPlugin = {...window.VideoSpeedPlugin, t0: parseInt(window.sessionStorage.getItem("t0"))};
    };

    const videoDivs = [...document.querySelectorAll("video")];
    let removePlugin = [...document.querySelectorAll('.speed-up-container')].length > 0 || videoDivs.length == 0;
    window.VideoSpeedPlugin.active = !removePlugin;
    window.VideoSpeedPlugin.last = Date.now();

    /* dh is divHandler that binds the relation to specific div within function */
    const dH = [];
    for (let i = 0; i < videoDivs.length; i++) {
        dH.push({});
        const videoDiv = videoDivs[i];
        
        dH[i].container = document.createElement("div");
        dH[i].container.className = "speed-up-container";
        
        dH[i].speedInput = document.createElement("input");
        dH[i].speedInput.type = "text";
        dH[i].speedInput.className = "speed-up-input";
        dH[i].speedInput.value = Math.round(videoDiv.playbackRate*100)/100;  

        dH[i].setSpeed = (val) => {
            videoDiv.playbackRate = parseFloat(val);
            dH[i].speedInput.value = Math.round(parseFloat(val)*100)/100;
            resetTime();
        }; 
        dH[i].changeSpeed = (change) => () => {
            dH[i].setSpeed(Math.max(0.1, videoDiv.playbackRate + parseFloat(change)));
        };
        dH[i].changeTime = (change) => () => {
            videoDiv.currentTime = Math.min(Math.max(0, videoDiv.currentTime + parseFloat(change)), videoDiv.duration);
        };
        
        dH[i].speedInput.oninput = () => {
            if(dH[i].speedInput.value.replace(/,/g, '.').endsWith(".")) return;
            dH[i].setSpeed(dH[i].speedInput.value.replace(/,/g, '.'));
        };

        const btnMaker = (innerText, tooltip, onClickFct) => {
            const btn = document.createElement("div");
            btn.className = "speed-up-btn";
            btn.setAttribute("data-string-tooltip", tooltip);

            const btnSpan = document.createElement("span");
            btnSpan.innerText = innerText;
            btn.onclick = onClickFct;
            
            btn.appendChild(btnSpan);
            dH[i].container.appendChild(btn);
        };
        
        btnMaker("-", "or press -", dH[i].changeSpeed(-0.1));
        dH[i].container.appendChild(dH[i].speedInput);
        btnMaker("+", "or press +", dH[i].changeSpeed(0.1));
        btnMaker("-15", "or press J", dH[i].changeTime(-15));
        btnMaker("+15", "or press L", dH[i].changeTime(15));
        let timeToFinish = (videoDiv.duration - videoDiv.currentTime) / videoDiv.playbackRate;
        btnMaker(timeToFinish < 60*60 ? 
            new Date(timeToFinish * 1000).toISOString().substr(14, 5) : 
            new Date(timeToFinish * 1000).toISOString().substr(11, 8), 
            `time to finish. Time passed since Plugin started: ${
                new Date(Date.now()-window.VideoSpeedPlugin.t0).toISOString().substr(11, 8)
            }`, () => resetTime());
        videoDiv.parentNode.insertBefore(dH[i].container, videoDiv);
    };
    
    const fullScreen = {element: document.fullscreenElement ? 
        videoDivs.some(div=>document.fullscreenElement.contains(div)) ?
        videoDivs[videoDivs.findIndex(div=>document.fullscreenElement.contains(div))]  : 
        null: null};

    /* iterate for all divs */
    const forDivArray = (call, change) => {
        for(let i = 0; i < videoDivs.length; i++) dH[i][call](change)();
    };

    /* Set remaining video time */
    const setTime = () => {
        videoDivs.forEach(videoDiv => {
            let timeToFinish = (videoDiv.duration - videoDiv.currentTime) / videoDiv.playbackRate;
            let timeToFinishString = timeToFinish < 60*60 ? 
                new Date(timeToFinish * 1000).toISOString().substr(14, 5) : 
                new Date(timeToFinish * 1000).toISOString().substr(11, 8);
            const timerDiv = videoDiv.previousElementSibling.lastChild;
            timerDiv.innerText = timeToFinishString;
            timerDiv.setAttribute("data-string-tooltip", 
                `time to finish. Time passed since Plugin started: ${
                    new Date(Date.now()-window.VideoSpeedPlugin.t0).toISOString().substr(11, 8)
                }`
            );
        });
    };

    /* Set timeout to update remaining time */
    const resetTime = (minUpdateTime = 0) => {
        if(!window.VideoSpeedPlugin.active || 
            (minUpdateTime && Math.round(Date.now() - window.VideoSpeedPlugin.last) < minUpdateTime)
        ) return;
        setTime();
        window.VideoSpeedPlugin.last = Date.now();
        /* return setTimeout(() => {
            clearTimeout(resetTime);
            if(videoDivs.some(videoDiv => !videoDiv.paused)) resetTime();
        }, 1000) */
    };

    /* Initiate timeout when plugin is loaded */
    resetTime();

    /* add eventlistener to videoDivs */
    const ontimeupdate = () => resetTime(500);
    videoDivs.forEach(videoDiv => videoDiv.addEventListener("timeupdate", ontimeupdate));
    
    /* add eventlistener to body */
    const onkeyup = (e) => {
        const uniqueDiv = videoDivs.length == 1 ? videoDivs[0] : document.fullscreenElement ? 
            videoDivs.some(div=>document.fullscreenElement.contains(div)) ?
            videoDivs[videoDivs.findIndex(div=>document.fullscreenElement.contains(div))]  : 
            null : null;

        if((e.keyCode == 32 || e.keyCode == 75) && uniqueDiv){
            if(uniqueDiv.paused) {
                uniqueDiv.play();
            } else {
                uniqueDiv.pause();
            };
        } else if(e.keyCode == 74) {
            forDivArray("changeTime", -15);
        } else if(e.keyCode == 76) {
            forDivArray("changeTime", 15);
        } else if(e.keyCode == 189) {
            forDivArray("changeSpeed", -0.1);
        } else if(e.keyCode == 187) {
            forDivArray("changeSpeed", 0.1);
        } else if(e.keyCode == 70) {
            fullScreen.element = uniqueDiv || videoDivs.some(div=>!div.paused) ?
            videoDivs[videoDivs.findIndex(div=>!div.paused)] : fullScreen.element;
            if(document.fullscreenElement) {
                document.exitFullscreen();
            } else if(fullScreen.element && fullScreen.element.webkitEnterFullscreen){
                fullScreen.element.parentElement.webkitRequestFullscreen();
            }; 
        };
    };
    document.body.onkeyup = onkeyup;

    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.className = "speed-up-style";

    let css = `
    .speed-up-container {
        display: flex; 
        justify-content: center; 
        position: absolute; 
        z-index: 9999; 
        pointer-events: none;
        opacity: 0.5;
        transition: opacity 1s 0.5s linear;
    }
    .speed-up-container:hover {
        opacity: 1;
        transition: opacity 0.1s 0s linear;
    }
    .speed-up-container * {
        pointer-events: all;
    }
    .speed-up-btn {
        display: inline;
        cursor: pointer;
        user-select: none;
        width: 50px;
        padding: 5px;
        margin: 5px;
        border-radius: 5px;
        background-color: #ccc;
        text-align: center;
    }
    .speed-up-btn:hover {
    background-color: #bbb;
    }
    .speed-up-input, .speed-up-btn span {
        font-size: 1rem
    }
    .speed-up-input {
        width: 50px;
        max-width: 50px;
        margin: 5px;
        border-radius: 5px;
        border-color: transparent;
    }
    .speed-up-btn:hover {
        position: relative;
        }
    .speed-up-btn:after {
        content: attr(data-string-tooltip);
        top: calc(100% + 10px);
        left: -50%;
        padding: 0.125rem 0.75rem 0.25rem 0.75rem;
        white-space: nowrap;
        border-radius: 0.5rem;
        border: 2px solid #333 !important;
        z-index: 10000;
        position: absolute;
        background-color: rgb(250, 250, 250);
        color: #111;
        font-size: 10px;
        font-style: italic;
        opacity: 0;
        pointer-events: none;
        box-shadow: 2px 2px 1px 1px rgba(0, 0, 0, 0.125);
        }
    .speed-up-btn:hover:after {
        opacity: 1;
        transition: opacity 0.2s 1.5s linear;
        }
    .speed-up-btn:before {
        content: ' ';
        z-index: 9999;
        width: 15px;
        height: 15px;
        background-color: #333;
        position: absolute;
        pointer-events: none;
        transform: rotate(45deg);
        opacity: 0;
        }
    .speed-up-btn:hover:before {
        opacity: 1;
        transition: opacity 0.2s 1.6s linear;
        top: calc(100% + 5px);
        left: 40%;
        }  
    `;

    style.appendChild(document.createTextNode(css));
    head.appendChild(style);

    /* Clean up HTML, eventlisteners and css */
    if(removePlugin){
        document.body.removeEventListener("onkeyup", onkeyup);
        videoDivs.forEach(videoDiv => videoDiv.removeEventListener("timeupdate", ontimeupdate));
        clearTimeout(resetTime);
        [...document.querySelectorAll('.speed-up-style')].forEach(e => e.remove());
        [...document.querySelectorAll('.speed-up-container')].forEach(e => e.remove());
    };
        
})();