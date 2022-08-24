import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { LocalStorageService } from '../local-storage.service';

@Component({
  selector: 'app-page-register',
  templateUrl: './page-register.component.html',
  styleUrls: ['./page-register.component.css']
})
export class PageRegisterComponent implements OnInit {

  constructor(
    private api: ApiService,
    private storage: LocalStorageService,
    private router: Router,
    private title: Title
  ) { }

  ngOnInit(): void {
    this.title.setTitle("A Social Media")
  }

  public formError = "";

  public credentials = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: ''
  }

  public formSubmit(): any {
    this.formError = "";

    if (
      !this.credentials.first_name ||
      !this.credentials.last_name ||
      !this.credentials.email ||
      !this.credentials.password ||
      !this.credentials.password_confirm
    ) {
      return this.formError = "All fields are required.";
    }




    if (this.credentials.password !== this.credentials.password_confirm) {
      return this.formError = "Passwords don't match."
    }

    return this.register();
  }

  private register(){
    let requestObject = {
      method: "POST",
      location: "users/register",
      body: this.credentials
    }

    this.api.makeRequest(requestObject).then((val: any) => {
      if(val.token){
        this.storage.setToken(val.token);
        this.router.navigate(["/"])
        return;
      }
      if(val.message){
        this.formError = val.message
      }
    })
  }

}
