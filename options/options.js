// document.addEventListener("DOMContentLoaded", () => {
    Options.loadOptions().then(() => {
        let keyupTimeout = null;

        const options = Options.instance;

        const saveOptions = e => {
            e.preventDefault();

            options.frontmatter = document.querySelector("[name='frontmatter']").value,
                options.backmatter = document.querySelector("[name='backmatter']").value,
                options.title = document.querySelector("[name='title']").value,
                options.disallowedChars = document.querySelector("[name='disallowedChars']").value,
                options.includeTemplate = document.querySelector("[name='includeTemplate']").checked,
                options.saveAs = document.querySelector("[name='saveAs']").checked,
                options.downloadImages = document.querySelector("[name='downloadImages']").checked,
                options.imagePrefix = document.querySelector("[name='imagePrefix']").value,
                options.turndownEscape = document.querySelector("[name='turndownEscape']").checked,
                // options.obsidianVault       = document.querySelector("[name='obsidianVault']").value,

                options.headingStyle = getCheckedValue(document.querySelectorAll("input[name='headingStyle']")),
                options.hr = getCheckedValue(document.querySelectorAll("input[name='hr']")),
                options.bulletListMarker = getCheckedValue(document.querySelectorAll("input[name='bulletListMarker']")),
                options.codeBlockStyle = getCheckedValue(document.querySelectorAll("input[name='codeBlockStyle']")),
                options.fence = getCheckedValue(document.querySelectorAll("input[name='fence']")),
                options.emDelimiter = getCheckedValue(document.querySelectorAll("input[name='emDelimiter']")),
                options.strongDelimiter = getCheckedValue(document.querySelectorAll("input[name='strongDelimiter']")),
                options.linkStyle = getCheckedValue(document.querySelectorAll("input[name='linkStyle']")),
                options.linkReferenceStyle = getCheckedValue(document.querySelectorAll("input[name='linkReferenceStyle']")),
                options.imageStyle = getCheckedValue(document.querySelectorAll("input[name='imageStyle']")),
                options.downloadMode = getCheckedValue(document.querySelectorAll("input[name='downloadMode']")),
                // options.obsidianPathType    = getCheckedValue(document.querySelectorAll("input[name='obsidianPathType']")),

                save();
        }

        const save = () => {
            const spinner = document.getElementById("spinner");
            spinner.style.display = "block";
            console.log('gonna save')
            Options.save()
                .then(() => {
                    spinner.style.display = "none";
                })
                .catch(err => {
                    document.querySelectorAll(".status").forEach(statusEl => {
                        statusEl.textContent = err;
                        statusEl.classList.remove('success');
                        statusEl.classList.add('error');
                    });
                    spinner.style.display = "none";
                });
        }

        const restoreOptions = () => {

            // if browser doesn't support the download api (i.e. Safari)
            // we have to use contentLink download mode
            if (!browser.downloads) {
                options.downloadMode = 'contentLink';
                document.querySelectorAll("[name='downloadMode']").forEach(el => el.disabled = true)
                document.querySelector('#downloadMode p').innerText = "The Downloas API is unavailable in this browser."
            }

            document.querySelector("[name='frontmatter']").value = options.frontmatter;
            document.querySelector("[name='backmatter']").value = options.backmatter;
            document.querySelector("[name='title']").value = options.title;
            document.querySelector("[name='disallowedChars']").value = options.disallowedChars;
            document.querySelector("[name='includeTemplate']").checked = options.includeTemplate;
            document.querySelector("[name='saveAs']").checked = options.saveAs;
            document.querySelector("[name='downloadImages']").checked = options.downloadImages;
            document.querySelector("[name='imagePrefix']").value = options.imagePrefix;
            document.querySelector("[name='turndownEscape']").checked = options.turndownEscape;
            // document.querySelector("[name='obsidianVault']").value      = options.obsidianVault;

            setCheckedValue(document.querySelectorAll("[name='headingStyle']"), options.headingStyle);
            setCheckedValue(document.querySelectorAll("[name='hr']"), options.hr);
            setCheckedValue(document.querySelectorAll("[name='bulletListMarker']"), options.bulletListMarker);
            setCheckedValue(document.querySelectorAll("[name='codeBlockStyle']"), options.codeBlockStyle);
            setCheckedValue(document.querySelectorAll("[name='fence']"), options.fence);
            setCheckedValue(document.querySelectorAll("[name='emDelimiter']"), options.emDelimiter);
            setCheckedValue(document.querySelectorAll("[name='strongDelimiter']"), options.strongDelimiter);
            setCheckedValue(document.querySelectorAll("[name='linkStyle']"), options.linkStyle);
            setCheckedValue(document.querySelectorAll("[name='linkReferenceStyle']"), options.linkReferenceStyle);
            setCheckedValue(document.querySelectorAll("[name='imageStyle']"), options.imageStyle);
            setCheckedValue(document.querySelectorAll("[name='downloadMode']"), options.downloadMode);
            // setCheckedValue(document.querySelectorAll("[name='obsidianPathType']"), options.obsidianPathType);
        
            textareaInput.bind(document.querySelector("[name='frontmatter']"))();
            textareaInput.bind(document.querySelector("[name='backmatter']"))();

            refereshElements();
        }

        function textareaInput() {
            this.parentNode.dataset.value = this.value;
        }

        const show = (el, show) => {
            if (show) {
                if (el.style.opacity == '0') {
                    el.style.transition = 'none';
                    el.style.height = 'auto';
                    const height = el.clientHeight;
                    el.style.height = '0';
                    el.style.transition = null;
                    setTimeout(() => {
                        el.style.height = height + 'px';
                        el.style.opacity = '1';
                        setTimeout(() => {
                            el.style.height = 'auto';
                        }, 301)
                    }, 1)
                }
            }
            else {
                if (el.style.height === '' || el.style.height == 'auto') {
                    const height = el.clientHeight;
                    el.style.height = height + 'px';
                    setTimeout(() => {
                        el.style.height = '0';
                        el.style.opacity = '0';
                    }, 1);
                }
            }
        }

        const refereshElements = () => {

            const downloadImages = options.downloadImages && options.downloadMode == 'downloadsApi';
            document.getElementById("downloadModeGroup").querySelectorAll('.radio-container,.checkbox-container,.textbox-container').forEach(container => {
                if (container.id == "imagePrefix") show(container, downloadImages);
                else show(container, options.downloadMode == 'downloadsApi')
            });

            // document.getElementById("obsidianUriGroup").querySelectorAll('.radio-container,.checkbox-container,.textbox-container').forEach(container => {
            //     show(container, options.downloadMode == 'obsidianUri')
            // });

            show(document.getElementById("linkReferenceStyle"), (options.linkStyle == "referenced"));

            show(document.getElementById("fence"), (options.codeBlockStyle == "fenced"));

            show(document.getElementById("frontmatter-container"), options.includeTemplate);
            show(document.getElementById("backmatter-container"), options.includeTemplate);

            document.getElementById('markdown').disabled = !downloadImages;
            document.getElementById('obsidian').disabled = !downloadImages;
            document.getElementById('obsidian-nofolder').disabled = !downloadImages;

        }

        const inputChange = e => {
            if (e) {
                let key = e.target.name;
                let value = e.target.value;
                if (e.target.type == "checkbox") value = e.target.checked;
                options[key] = value;
            }
        
            save();

            refereshElements();
        }

        const inputKeyup = (e) => {
            if (keyupTimeout) clearTimeout(keyupTimeout);
            keyupTimeout = setTimeout(inputChange, 500, e);
        }

        const loaded = () => {
            document.querySelectorAll('.radio-container,.checkbox-container,.textbox-container').forEach(container => {
                container.dataset.height = container.clientHeight;
            });

            restoreOptions();

            // add notification listener
            browser.runtime.onMessage.addListener(message => {
                if (message.type == 'optionsUpdate') {
                    restoreOptions();
                }
            });

            document.querySelectorAll('input,textarea').forEach(input => {
                if (input.tagName == "TEXTAREA" || input.type == "text") {
                    input.addEventListener('keyup', inputKeyup);
                }
                else input.addEventListener('change', inputChange);
            })
        }


        document.querySelectorAll(".save").forEach(el => el.addEventListener("click", saveOptions));
        document.querySelectorAll(".input-sizer > textarea").forEach(el => el.addEventListener("input", textareaInput));

        loaded();

        /// https://www.somacon.com/p143.php
        // return the value of the radio button that is checked
        // return an empty string if none are checked, or
        // there are no radio buttons
        function getCheckedValue(radioObj) {
            if (!radioObj)
                return "";
            var radioLength = radioObj.length;
            if (radioLength == undefined)
                if (radioObj.checked)
                    return radioObj.value;
                else
                    return "";
            for (var i = 0; i < radioLength; i++) {
                if (radioObj[i].checked) {
                    return radioObj[i].value;
                }
            }
            return "";
        }

        // set the radio button with the given value as being checked
        // do nothing if there are no radio buttons
        // if the given value does not exist, all the radio buttons
        // are reset to unchecked
        function setCheckedValue(radioObj, newValue) {
            if (!radioObj)
                return;
            var radioLength = radioObj.length;
            if (radioLength == undefined) {
                radioObj.checked = (radioObj.value == newValue.toString());
                return;
            }
            for (var i = 0; i < radioLength; i++) {
                radioObj[i].checked = false;
                if (radioObj[i].value == newValue.toString()) {
                    radioObj[i].checked = true;
                }
            }
        }
    })
// })