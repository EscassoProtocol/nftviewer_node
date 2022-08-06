"use strict";

class PasswordDialog{
    constructor() {
        this.confirmation = false;
    }

    initViews(title1, title2){
        document.getElementsByClassName("password-dialog-title-1")[0].innerHTML = title1 ? title1 : "";
        document.getElementsByClassName("password-dialog-title-2")[0].innerHTML = title2 ? title2 : "";
        document.getElementsByClassName('password-dialog-back')[0].addEventListener('click', this.onBackClicked);
        document.getElementsByClassName('password-dialog-ok')[0].addEventListener('click', this.onOKClicked);
        passwordDialog.clickShowPassword();
        this.cleanInputs();
    }

    onEnterClicked(instance, resolve){
        if(passwordDialog.confirmation){
            if(document.getElementsByClassName("password")[0].value !== "" &&
                document.getElementsByClassName("repeat-password")[0].value !== ""){
                instance.onOKClicked(resolve);
            }
        }
        else{
            if(document.getElementsByClassName("password")[0].value !== ""){
                instance.onOKClicked(resolve);
            }
        }
    }

    showPasswordDialog(instance, showConfirmationInput){
        return new Promise(function(resolve, reject) {
            try{
                passwordDialog.showClassName("dialog-background", 0);

                passwordDialog.confirmation = showConfirmationInput;
                passwordDialog.setEnterClick(document.getElementsByClassName("password")[0], () => {
                    passwordDialog.onEnterClicked(instance, resolve)
                });
                passwordDialog.setEnterClick(document.getElementsByClassName("repeat-password")[0], () => {
                    passwordDialog.onEnterClicked(instance, resolve)
                });
                passwordDialog.clickShowPassword();

                document.getElementsByClassName("password-dialog")[0].classList.remove("invisible");
                if(showConfirmationInput){
                    document.getElementsByClassName("password-dialog")[0].classList.remove("password-dialog-not-confirmation-style");
                    document.getElementsByClassName("password-div")[0].classList.remove("password-not-confirmation-style");
                    document.getElementsByClassName("buttons-row")[0].classList.add("buttons-style");
                    document.getElementsByClassName("buttons-row")[0].classList.remove("btn-not-confirmation-style");
                    passwordDialog.showClassName("repeat-password-div",0);
                }
                else{
                    document.getElementsByClassName("password-dialog")[0].classList.add("password-dialog-not-confirmation-style");
                    document.getElementsByClassName("password-div")[0].classList.add("password-not-confirmation-style");
                    document.getElementsByClassName("buttons-row")[0].classList.remove("buttons-style");
                    document.getElementsByClassName("buttons-row")[0].classList.add("btn-not-confirmation-style");
                    passwordDialog.hideClassName("repeat-password-div",0);
                }
                document.getElementsByClassName('password-dialog-ok')[0].addEventListener('click', () => {
                    instance.onOKClicked(resolve);
                });
                document.getElementsByClassName('password-dialog-back')[0].addEventListener('click', () => {
                    instance.onBackClicked(resolve);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }

    onOKClicked(resolve){}

    onBackClicked(){
        document.getElementsByClassName("password-dialog")[0].classList.add("invisible");
        passwordDialog.hideClassName("dialog-background", 0);
    }

    getPassword(){
        return document.getElementsByClassName("password")[0].value;
    }

    getConfirmationPassword(){
        return document.getElementsByClassName("repeat-password")[0].value;
    }

    cleanInputs(){
        document.getElementsByClassName("password")[0].value = "";
        document.getElementsByClassName("repeat-password")[0].value = "";
    }

    hasConfirmation(){
        return passwordDialog.confirmation;
    }

    setEnterClick(input, action){
        input.addEventListener("keyup", function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                action();
            }
        });
    }

    showClassName(className, index){
        document.getElementsByClassName(className)[index].classList.remove("d-none");
        document.getElementsByClassName(className)[index].style.display = "d-block";
        document.getElementsByClassName(className)[index].classList.remove("none");
        document.getElementsByClassName(className)[index].style.display = "block";
        document.getElementsByClassName(className)[index].classList.remove("invisible");
    }

    hideClassName(className, index){
        document.getElementsByClassName(className)[index].classList.remove("d-block");
        document.getElementsByClassName(className)[index].style.display = "d-none";
        document.getElementsByClassName(className)[index].classList.remove("block");
        document.getElementsByClassName(className)[index].style.display = "none";
        document.getElementsByClassName(className)[index].classList.add("invisible");
    }

    showPassword(element) {
        if (element.type === "password") {
            element.type = "text";
        } else {
            element.type = "password";
        }
    }

    clickShowPassword(){
        document.getElementsByClassName('show-password')[0].addEventListener('click', () => {
            passwordDialog.showPassword(document.getElementsByClassName("password")[0]);
        });
        document.getElementsByClassName('show-password')[1].addEventListener('click', () => {
            passwordDialog.showPassword(document.getElementsByClassName("repeat-password")[0]);
        });
    }
}
const passwordDialog = new PasswordDialog();
export {passwordDialog};