import React from "react";

type IfParameters = {    
    expr: boolean,
    onTrue: HTMLElement,
    onFalse: HTMLElement
}

export const If = (props: IfParameters) => {
    const { expr, onTrue, onFalse} = props
    if (expr) {
        return (
            <>
                {onTrue}
            </>
        )
    }

    return (
        <>
            {onFalse}
        </>
    )
}