import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Signup } from './signup.model';

@Injectable({
  providedIn: 'root'
})
export class SignupService {
  private url = '/api/user/'
  constructor(private httpClient : HttpClient) {
    
   }

  public postSignUp(signUp : Signup) : any {
    return this.httpClient.post<boolean>(environment.API_URL + this.url + 'Regist', signUp, { withCredentials: true });
  }
}
