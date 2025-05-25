import prisma from "~/lib/prisma";
import {getServerSession} from "#auth";

export default defineEventHandler(async event => {

    const { inviteCode, workspaceId } = getQuery(event);
    const session = await getServerSession(event);

    if (!inviteCode || !workspaceId) {
        return {
            status: 400,
            body: {
                message: 'Invite code or workspace ID is missing'
            }
        };
    }
    console.log('Joining workspace with invite code:', inviteCode, 'and workspace ID:', workspaceId);
    const workspace = await prisma.workspace.findUnique({
        where: {
            id: workspaceId,
            inviteCode: inviteCode,
        }
    });

    console.log('Found workspace:', workspace);

    if (!workspace) {
        console.error('Workspace not found');
        return {
            status: 404,
            body: {
                message: 'Workspace not found'
            }
        };
    }


    const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
            userId_workspaceId: {
                workspaceId: workspaceId,
                userId: session?.user?.id
            }
        }
    });

    if (workspaceMember) {
        console.error('User is already a member of the workspace');
        return {
            status: 400,
            body: {
                message: 'You are already a member of this workspace'
            }
        };
    }

    // create a new workspace member
    const newWorkspaceMember = await prisma.workspaceMember.create({
        data: {
            workspaceId: workspaceId,
            userId: session?.user?.id,
        }
    });

    if(!newWorkspaceMember) {
        console.error('Failed to create workspace member');
        return {
            status: 500,
            body: {
                message: 'Failed to join the workspace'
            }
        }
    };

    console.log('User successfully joined the workspace', newWorkspaceMember);

    return {
        status: 200,
        body: {
            message: 'Successfully joined the workspace',
            workspaceMember: newWorkspaceMember
        }
    };
    

})