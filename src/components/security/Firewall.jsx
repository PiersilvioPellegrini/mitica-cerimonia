import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function Firewall({ children }) {
    const location = useLocation();
    // EMERGENCY OVERRIDE: Always render children, disable all blocking
    return <>{children}</>;
}
