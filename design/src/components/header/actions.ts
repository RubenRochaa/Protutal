"use server"

import { redirect } from 'next/navigation'
import { deleteSessaoServer } from '@/lib/cookieServer'

// O cookie "session" é httpOnly: só o servidor consegue apagá-lo.
// Por isso o logout é uma Server Action, chamada pelo botão "Sair" do Header.
export async function handleLogout(){
    await deleteSessaoServer()

    redirect("/")
}
