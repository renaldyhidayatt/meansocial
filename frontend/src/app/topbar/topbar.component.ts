import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { EventEmitterService } from '../event-emitter.service';
import { LocalStorageService } from '../local-storage.service';
import { AutoUnsubscribe } from '../unsubcribe';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})

@AutoUnsubscribe
export class TopbarComponent implements OnInit {
  private subscriptions = [];
    public query: string = "";
    public sendMessageObject = {
        id: "",
        name: "",
        content: "",
    }
    public alertMessage: string = "";
    
    // User Data
    public usersName: string = "";
    public usersId: string = "";
    public profilePicture: string = "default-avatar";
    public messagePreviews = [];
    public alerts = [];
    public notifications = {
        alerts: 0,
        friendRequests: 0,
        messages: 0
    }

  constructor(
    public auth: AuthService,
    private router: Router,
    private storage: LocalStorageService,
    private events: EventEmitterService,
    private api: ApiService,
  ) { }

  ngOnInit(): void {
    this.usersName = this.storage.getParsedToken().name;
        this.usersId = this.storage.getParsedToken()._id;
        
        let alertEvent = this.events.onAlertEvent.subscribe((msg) => {
            this.alertMessage = msg;
        });
        
        let friendRequestEvent = this.events.updateNumOfFriendRequestsEvent.subscribe((msg) => {
            this.notifications.friendRequests--;
        });
        
        let userDataEvent = this.events.getUserData.subscribe((user) => {
            this.notifications.friendRequests = user.friend_requests.length;
            this.notifications.messages = user.new_message_notifications.length;
            this.notifications.alerts = user.new_notifications;
            this.profilePicture = user.profile_image;
            
            this.setAlerts(user.notifications);
            this.setMessagePreviews(user.messages, user.new_message_notifications);
        });
        
        let updateMessageEvent = this.events.updateSendMessageObjectEvent.subscribe((d) => {
            this.sendMessageObject.id = d.id;
            this.sendMessageObject.name = d.name;
        });
        
        let resetMessagesEvent = this.events.resetMessageNotificationsEvent.subscribe(() => {
            this.notifications.messages = 0;
        });
        
        let requestObject = {
            location: `users/get-user-data/${this.usersId}`,
            method: "GET",
        }
        
        this.api.makeRequest(requestObject).then((val) => {
            if(val.status == 404) { return this.auth.logout(); }
            
            if(val.statusCode == 200) {
                this.events.getUserData.emit(val.user);
            }
        });
        
        
        this.subscriptions.push(alertEvent, friendRequestEvent, userDataEvent, updateMessageEvent, resetMessagesEvent);
  }

}
