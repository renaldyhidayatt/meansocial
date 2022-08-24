import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthService } from './auth.service';
import { PageLoginComponent } from './page-login/page-login.component';
import { PageRegisterComponent } from './page-register/page-register.component';

const routes: Routes = [
  {
    path: "",
    redirectTo: "/register",
    pathMatch: "full"
  },
  {
    path: "register",
    component: PageRegisterComponent,
    canActivate: [AuthService]
  },
  {
    path: "login",
    component: PageLoginComponent,
    canActivate: [AuthService]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
