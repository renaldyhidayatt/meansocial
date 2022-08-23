import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  tokenName = "--token-ASM-PROD";
  postThemeName = "--post-theme-ASM-PROD";
  constructor() {}

  private set(key: string, value:any){
    if(localStorage){
      localStorage.setItem(key, value)
    }
  }

  public get(key: string): any{
    if(localStorage){
      if(key in localStorage){
        return localStorage.getItem(key)
      }
    }else{
      alert("Browser does not support the localStorage api")
    }
  }


  public setToken(token: any){
    this.set(this.tokenName, token)
  }

  public getToken(){
    return this.get(this.tokenName);
  }

  public getParsedToken(){
    let token = this.getToken();

    return JSON.parse(atob(token.split('.')[1]))
  }

  public removeToken(){
    localStorage.removeItem(this.tokenName);
  }

  public setPostTheme(theme: any){
    this.set(this.postThemeName, theme);
  }

  public getPostTheme(){
    return this.get(this.postThemeName);
  }
}
