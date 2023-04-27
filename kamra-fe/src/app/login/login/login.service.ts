import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Login } from './login.model';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private url = '/api/user/'
  constructor(private httpClient : HttpClient) {
    
   }

  public postLogin(login : Login) : Observable<string> {
    return this.httpClient.post(environment.API_URL + this.url + 'Login', login, { withCredentials: true, responseType: "text" });
  }

  public getUserTest() : Observable<string> {
    return this.httpClient.get(environment.API_URL + this.url + 'UserTest',{ withCredentials: true, responseType: "text" });
  }

  public getSATest() : Observable<string> {
    return this.httpClient.get(environment.API_URL + this.url + 'SATest',{ withCredentials: true, responseType: "text" });
  }
}
