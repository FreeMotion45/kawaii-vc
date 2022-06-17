import React from "react"
import Button from "react-bootstrap/Button"
import CSS from "csstype"

// TODO: Find how to make it resize normally when not using PX units.

const channelNameStyle: CSS.Properties = {
    display: 'block',
    color: '#E2CFEA',
    fontSize: '1.25em',
    marginBottom: '5%',
}

const channelDescriptionStyle: CSS.Properties = {
    color: '#E2CFEA',
    fontSize: '.75em',
}

const barContainerStyle: CSS.Properties = {
    display: 'inline-block',
    padding: '1%',
    backgroundColor: '#59405C',
    borderColor: '#59405C',
    borderRadius: '5px',
}

const categoryContainerStyle: CSS.Properties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px',
    border: 'dashed 2px white',
    borderRadius: '5px',
}

const optionButtonStyle: CSS.Properties = {    
    margin: '1px 3px 1px 3px',
}

export const SideBar = () => {
    return (
        <div style={barContainerStyle}>
                <span style={channelNameStyle}>
                    Server options:
                </span>                

                <div style={categoryContainerStyle}>
                    <span style={channelDescriptionStyle}>
                        Channels:
                    </span>

                    <Button variant="light" style={optionButtonStyle}>
                        Add channel
                    </Button>
                    <Button variant="light" style={optionButtonStyle}>
                        Remove channel
                    </Button>
                </div>
        </div>
    )
}