import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { EventEmitterService } from '../event-emitter.service';
import { AutoUnsubscribe } from '../unsubcribe';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})

@AutoUnsubscribe
export class SidebarComponent implements OnInit {

  constructor(
    public auth: AuthService,
    private events: EventEmitterService
  ) { }

  ngOnInit(): void {
    this.events.getUserData.subscribe((user: any) => {
      this.userId = user._id
      this.besties = user.besties;
      this.enemies = user.enemies;

    });
  }

  public userId = "";
  public besties: any[] = [];
  public enemies: any[] = [];


}
