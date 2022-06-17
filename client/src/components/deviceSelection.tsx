import React, { useEffect, useState } from "react"
import { If, True, False } from "./if"

export const DeviceSelectionWindow = (props: any) => {
    const { selectedDeviceId, setSelectedDeviceId } = props
    const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[] | undefined>(undefined)

    useEffect(() => {
        const loadAvailableDevices = async () => {
            const availableDevices = await navigator.mediaDevices.enumerateDevices()

            const devices: MediaDeviceInfo[] = []
            availableDevices.forEach(deviceInfo => {
                if (deviceInfo.kind === 'audioinput') {
                    devices.push(deviceInfo)
                }
            })
            setAvailableDevices(devices)
        }

        loadAvailableDevices()
    }, [])

    return (
        <div>
            <If expr={availableDevices === undefined}>
                <True>
                    <span>
                        Loading available audio devices...
                    </span>
                </True>
                <False>
                    <label htmlFor="audio-input-device-selection">Audio input:</label>
                    <select id="audio-input-device-selection" onChange={(e) => setSelectedDeviceId(e.target.value)}>
                        {availableDevices?.map(deviceInfo => {                            
                            return <option key={deviceInfo.deviceId} selected={deviceInfo.deviceId === selectedDeviceId} value={deviceInfo.deviceId}>{deviceInfo.label}</option>                            
                        })}
                    </select>
                </False>
            </If>                        
        </div>
    )
}