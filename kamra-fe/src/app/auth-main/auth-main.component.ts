import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth-main',
  templateUrl: './auth-main.component.html',
  styleUrls: ['./auth-main.component.scss']
})
export class AuthMainComponent implements OnInit {

  constructor() { }

  public showLoginComponent : boolean;
  public showSignupComponent : boolean;

  ngOnInit(): void {
    this.showLoginComponent = true;
    this.showSignupComponent = false;
  }

  showLogin(): void{
    this.showLoginComponent = true;
    this.showSignupComponent = false;
  }

  showSignup(): void{
    this.showLoginComponent = false;
    this.showSignupComponent = true;
  }
}
