import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EventEmitterService {

  onAlertEvent: EventEmitter<string> = new EventEmitter();
  updateNumOfFriendRequestsEvent: EventEmitter<string> = new EventEmitter();
  updateSendMessageObjectEvent: EventEmitter<object> = new EventEmitter();
  resetMessageNotificationsEvent: EventEmitter<string> = new EventEmitter();
  getUserData: EventEmitter<any> = new EventEmitter();
  constructor() { }
}
