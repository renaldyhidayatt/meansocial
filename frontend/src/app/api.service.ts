import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EventEmitterService } from './event-emitter.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
    private storage: LocalStorageService,
    private events: EventEmitterService
  ) { }
  private baseUrl = environment.baseUrl;

  private successHandler(value: any) {
    return value;
  }

  private errorHandler(error: any) {
    return error;
  }

  public makeRequest(requestObject: any): any {
    let method = requestObject.method.toLowerCase();
    if (!method) {
      return console.log("No method specified in the request object.")
    }

    let body = requestObject.body || {};
    let location = requestObject.location;
    if (!location) {
      return console.log("No Location specified in the request object")
    }

    let url = `${this.baseUrl}/${location}`;

    let httpOptions = {};

    if (this.storage.getToken()) {
      httpOptions = {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.storage.getToken()}`
        })
      }
    }

    if (method == "get") {
      return this.http.get(url, httpOptions).toPromise().then(this.successHandler).catch(this.errorHandler)
    }

    if (method === "post") {
      return this.http.post(url, body, httpOptions).toPromise()
        .then(this.successHandler)
        .catch(this.errorHandler);
    }

    console.log("Could not make the request. Make sure a method of GET or POST is supplied.");

  }
}
