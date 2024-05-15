'use client';
import { useEffect, useState } from 'react';
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
  OwnCapability
} from '@stream-io/video-react-sdk';

import Alert from './Alert';
import { Button } from './ui/button';

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#call-state
  const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();
  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  const call = useCall();

  if (!call) {
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );
  }

  // https://getstream.io/video/docs/react/ui-cookbook/replacing-call-controls/
  const [isMicCamToggled, setIsMicCamToggled] = useState(false);

  useEffect(() => {
    if (isMicCamToggled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [isMicCamToggled, call.camera, call.microphone]);

  // HLS
  const [isProtocolHLS, setIsProtocolHLS] = useState(false);
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  useEffect(() =>{
    if (isProtocolHLS) {
      if (localParticipant) {
        call.updateUserPermissions({
          user_id: localParticipant.userId,
          grant_permissions: [OwnCapability.UPDATE_CALL],
        });
        call.update({
          settings_override: {
            broadcasting: {
              // hls : {enabled : !Boolean((meetingState.localeCompare('HLS meeting')))}
              hls : {enabled : true,
                    quality_tracks : ['360p', '720p', '1080p']
              },
            },
          },
        });
        call.updateUserPermissions({
          user_id: localParticipant.userId,
          revoke_permissions: [OwnCapability.UPDATE_CALL],
        });
  }
  }
  else {
    if (localParticipant) {
      call.updateUserPermissions({
        user_id: localParticipant.userId,
        grant_permissions: [OwnCapability.UPDATE_CALL],
      });
      call.update({
        settings_override: {
          broadcasting: {
            // hls : {enabled : !Boolean((meetingState.localeCompare('HLS meeting')))}
            hls : {enabled : false},
          },
        },
      });
      call.updateUserPermissions({
        user_id: localParticipant.userId,
        revoke_permissions: [OwnCapability.UPDATE_CALL],
      });
    }
  }
  }, [isProtocolHLS, call])

  if (callTimeNotArrived)
    return (
      <Alert
        title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
      />
    );

  if (callHasEnded)
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
      <h1 className="text-center text-2xl font-bold">Setup</h1>
      <VideoPreview />
      <div className="flex h-16 items-center justify-center gap-3">
        <label className="flex items-center justify-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isMicCamToggled}
            onChange={(e) => setIsMicCamToggled(e.target.checked)}
          />
          Join with mic and camera off
        </label>
        <label className="flex items-center justify-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isProtocolHLS}
            onChange={(e) => setIsProtocolHLS(e.target.checked)}
          />
          HLS broadcasting
        </label>
        <DeviceSettings />
      </div>
      <Button
        className="rounded-md bg-green-500 px-4 py-2.5"
        onClick={() => {
          call.join();
          setIsSetupComplete(true);
        }}
      >
        Join meeting
      </Button>
    </div>
  );
};

export default MeetingSetup;
